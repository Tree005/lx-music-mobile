import { memo, forwardRef, useCallback, useImperativeHandle, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, PanResponder, View } from 'react-native'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { useWindowSize } from '@/utils/hooks'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { getMusicPicUrl } from '@/utils/musicPic'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

// 横向滑动切歌的外层容器：跟手平移当前内容，相邻歌的预览（封面 + 歌名）从两侧滑入，
// 松手滑够（阈值）补齐动画后真正切歌、不够回弹。
// 与播放条「三格轨道」同一套交互（左滑下一首、右滑上一首），全屏播放页与心动页共用。
// 预览数据由调用方提供：必须与「实际会播放的歌」一致（随机播放时用预取缓存保证）。
// 按钮点击上一首/下一首时也可以通过 ref 的 triggerSwipe 触发同款滑动动画（视觉连续）

// 横向位移超过它才接管手势（避免和页面里的竖滑/点击抢）
const SWIPE_THRESHOLD = 10
// 横向意图判定：横向位移要明显大于纵向位移才接管（页面里还有上下滑看歌词的手势）
const DIRECTION_RATIO = 1.5
// 松手后的补齐 / 回弹动画时长
const SETTLE_DURATION = 180
// 提交切歌后的兜底：歌曲信息迟迟不落地也要把位移复位
const COMMIT_TIMEOUT = 1200
// 预览里没有相邻歌时的阻尼（仍可滑动切歌，只是没有预览滑进来）
const NO_PREVIEW_DAMPING = 0.35
// 按钮触发切歌时的滑动动画时长
const TRIGGER_DURATION = 220
// 两次切歌的最小间隔（ms）：短时间内快速连点/连滑直接忽略，给封面预取和加载留时间（间隔内切歌必闪占位）
const SWITCH_THROTTLE = 800
// 预览封面的圆角（与真实封面一致）
const PREVIEW_BORDER_RADIUS = scaleSizeW(3)

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))

/** 把「播放列表项」形态的歌转成纯歌曲信息（预览层只关心歌曲信息） */
export const toPreviewMusicInfo = (m: LX.Music.MusicInfo | LX.Download.ListItem | null | undefined): LX.Music.MusicInfo | null => {
  if (!m) return null
  return 'progress' in m ? m.metadata.musicInfo : m
}

/** 后台预热相邻歌的封面地址（getMusicPicUrl 内部按歌曲 id 缓存）：
 * 歌一变化就拉好相邻歌的封面 URL，等手指按下滑动、预览层挂载时大概率已就绪，
 * 不然快速滑动切到没播过的歌时，预览封面要现取 URL，来不及就露占位（闪白） */
const prefetchPreviewPic = (info: LX.Music.MusicInfo | null) => {
  if (!info) return
  void getMusicPicUrl(info).catch(() => {})
}

/** 相邻歌的简化预览层：封面 + 歌名/歌手；两者的垂直位置都与真实页面严格对齐（减少切换时的跳变） */
const PreviewLayer = memo(({ musicInfo, coverSize, coverBottomSpace }: {
  musicInfo: LX.Music.MusicInfo
  coverSize: number
  coverBottomSpace: number
}) => {
  const pic = useMusicPic(musicInfo)
  return (
    <View style={styles.preview}>
      {/* 封面：贴底 + 与真实封面相同的底边距（coverBottomSpace），尺寸与真实封面一致；
          封面地址没来得及取到时显示深色圆角块（与暗背景融合），不用近白占位（会在深色页面上闪白） */}
      <View style={[styles.previewCoverBox, { paddingBottom: coverBottomSpace }]}>
        {
          coverSize > 0
            ? pic
              ? <Image url={pic} style={{ width: coverSize, height: coverSize, borderRadius: PREVIEW_BORDER_RADIUS }} />
              : <View style={{ width: coverSize, height: coverSize, borderRadius: PREVIEW_BORDER_RADIUS, backgroundColor: 'rgba(0, 0, 0, 0.35)' }} />
            : null
        }
      </View>
      {/* 歌名/歌手：贴内容区底部（对齐真实信息行的位置） */}
      <View style={styles.previewInfo}>
        <Text numberOfLines={1} size={20} color="#fff" style={styles.previewName}>{musicInfo.name}</Text>
        <Text numberOfLines={1} size={14} color="rgba(255, 255, 255, 0.7)" style={styles.previewSinger}>{musicInfo.singer}</Text>
      </View>
    </View>
  )
})

export interface SwipeSongContainerProps {
  children: ReactNode
  /** 当前内容的歌 key：歌变化时复位滑动动画 */
  currentKey: string
  /** 预览封面的边长（与真实封面一致，减少切换瞬间的跳变） */
  coverSize: number
  /** 预览封面底边到内容区底部的距离（对齐真实封面的位置） */
  coverBottomSpace: number
  /** 取「下一首」预览（异步；结果要与实际播放一致），没有则 null */
  fetchNext: () => Promise<LX.Music.MusicInfo | null>
  /** 取「上一首」预览，没有则 null */
  fetchPrev: () => LX.Music.MusicInfo | null
  /** 滑够、动画归位后真正切歌 */
  onSwipeNext: () => void
  onSwipePrev: () => void
}

export interface SwipeSongContainerType {
  /** 程序化触发一次滑动切歌（点击上一首/下一首按钮时的滑动视觉），动画完成后走 onSwipeNext/onSwipePrev */
  triggerSwipe: (direction: 1 | -1) => void
}

export default memo(forwardRef<SwipeSongContainerType, SwipeSongContainerProps>(({
  children,
  currentKey,
  coverSize,
  coverBottomSpace,
  fetchNext,
  fetchPrev,
  onSwipeNext,
  onSwipePrev,
}, ref) => {
  const { width } = useWindowSize()
  const [nextMusic, setNextMusic] = useState<LX.Music.MusicInfo | null>(null)
  const [prevMusic, setPrevMusic] = useState<LX.Music.MusicInfo | null>(null)
  // 预览层只在拖动期间挂载（平时不占渲染开销、不请求相邻歌封面）
  const [dragActive, setDragActive] = useState(false)

  const dragX = useRef(new Animated.Value(0)).current
  const startXRef = useRef(0)
  const committedRef = useRef(false)
  const lastCommitTimeRef = useRef(0)
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextReqRef = useRef(0)
  // 手势回调只创建一次，宽度 / 相邻歌通过 ref 取最新值
  const stateRef = useRef({ width: 0, canNext: false, canPrev: false })
  stateRef.current.width = width
  stateRef.current.canNext = !!nextMusic
  stateRef.current.canPrev = !!prevMusic

  // 取真正的下一首（随机播放时这次调用会把结果提前定下来，与实际播放的是同一首）；
  // 已有结果时返回同一个，重复调用安全（只认最后一次请求的结果）
  const refreshNext = useCallback(() => {
    const req = ++nextReqRef.current
    void fetchNext().then(info => {
      if (req !== nextReqRef.current) return
      setNextMusic(info)
      prefetchPreviewPic(info)
    })
  }, [fetchNext])

  const refreshPrev = useCallback(() => {
    const info = fetchPrev()
    setPrevMusic(info)
    prefetchPreviewPic(info)
  }, [fetchPrev])

  // 歌变了：刷新相邻预览
  useEffect(() => {
    refreshNext()
    refreshPrev()
  }, [currentKey, refreshNext, refreshPrev])

  // 补齐 / 回弹动画
  const settle = useCallback((to: number, then?: () => void) => {
    Animated.timing(dragX, {
      toValue: to,
      duration: SETTLE_DURATION,
      easing: Easing.out(Easing.quad),
      // 手势期间由 JS 侧 setValue 驱动，这里同样用 JS 驱动，避免混用警告
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) then?.()
    })
  }, [dragX])

  // 容器滑到位后真正切歌；等歌曲变化（currentKey）再把位移复位——
  // 此时新歌内容已经渲染，复位在视觉上等于「停在原位」。
  // 复位时同步把手势基值归零：若此刻手指还按着（快速连滑），后续 move 会从 0 重新跟手，不会跳变
  const commit = useCallback((direction: 1 | -1) => {
    if (committedRef.current) return
    committedRef.current = true
    lastCommitTimeRef.current = Date.now()
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null
      if (!committedRef.current) return
      committedRef.current = false
      setDragActive(false)
      dragX.setValue(0)
      startXRef.current = 0
    }, COMMIT_TIMEOUT)
    if (direction == 1) onSwipeNext()
    else onSwipePrev()
  }, [dragX, onSwipeNext, onSwipePrev])

  // 歌变了：复位（提交切歌后，新内容在视觉上就「停」在中间位置）
  useLayoutEffect(() => {
    if (!committedRef.current) return
    committedRef.current = false
    setDragActive(false)
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current)
      commitTimerRef.current = null
    }
    dragX.stopAnimation()
    dragX.setValue(0)
    startXRef.current = 0
  }, [currentKey, dragX])

  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
  }, [])

  // 程序化触发：点击上一首/下一首按钮时的滑动视觉（滑出 → 提交切歌 → 歌变化复位）
  const triggerSwipe = useCallback((direction: 1 | -1) => {
    if (committedRef.current) return
    // 限速：短时间连点按钮直接忽略
    if (Date.now() - lastCommitTimeRef.current < SWITCH_THROTTLE) return
    const w = stateRef.current.width
    if (!w) {
      commit(direction)
      return
    }
    refreshNext()
    refreshPrev()
    setDragActive(true)
    const target = direction == 1 ? -w : w
    Animated.timing(dragX, {
      toValue: target,
      duration: TRIGGER_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) commit(direction)
    })
  }, [commit, dragX, refreshNext, refreshPrev])

  useImperativeHandle(ref, () => ({ triggerSwipe }), [triggerSwipe])

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // 横向意图：接管（切歌跟手）；纵向手势由内层 PageSlider 自己处理
        return Math.abs(g.dx) > SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy) * DIRECTION_RATIO
      },
      onPanResponderGrant: () => {
        // 手势开始时再取一次相邻歌（开播等时机会把预取结果清掉，这里保证滑进来的与实际一致）
        refreshNext()
        refreshPrev()
        setDragActive(true)
        dragX.stopAnimation((value: number) => { startXRef.current = value })
      },
      onPanResponderMove: (_, g) => {
        const w = stateRef.current.width
        if (!w) return
        let dx = g.dx
        // 该方向没有相邻歌时加阻尼：仍可以滑动切歌，只是没有「滑进来的预览」
        if ((dx < 0 && !stateRef.current.canNext) || (dx > 0 && !stateRef.current.canPrev)) dx *= NO_PREVIEW_DAMPING
        dragX.setValue(clamp(startXRef.current + dx, -w, w))
      },
      onPanResponderRelease: (_, g) => {
        const w = stateRef.current.width
        if (!w) return
        const trigger = Math.max(60, w * 0.15)
        const finalX = clamp(startXRef.current + g.dx, -w, w)
        // 限速：距上次切歌太近视为没滑够（弹回），避免快速连滑导致封面来不及就位
        const throttled = Date.now() - lastCommitTimeRef.current < SWITCH_THROTTLE
        if (finalX <= -trigger && !throttled) settle(-w, () => { commit(1) })
        else if (finalX >= trigger && !throttled) settle(w, () => { commit(-1) })
        else settle(0, () => { setDragActive(false) })
      },
      onPanResponderTerminate: () => {
        settle(0, () => { setDragActive(false) })
      },
    })
  }, [dragX, refreshNext, refreshPrev, commit, settle])

  const prevTranslate = useMemo(
    () => dragX.interpolate({ inputRange: [-width, 0, width], outputRange: [-width * 2, -width, 0] }),
    [dragX, width],
  )
  const nextTranslate = useMemo(
    () => dragX.interpolate({ inputRange: [-width, 0, width], outputRange: [0, width, width * 2] }),
    [dragX, width],
  )
  const dragStyle = useMemo(() => ({ transform: [{ translateX: dragX }] }), [dragX])
  const prevStyle = useMemo(() => ({ transform: [{ translateX: prevTranslate }] }), [prevTranslate])
  const nextStyle = useMemo(() => ({ transform: [{ translateX: nextTranslate }] }), [nextTranslate])

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 预览层放在主内容层下面：同一坐标系里同向平移，互相不重叠 */}
      {dragActive && prevMusic
        ? (
            <Animated.View pointerEvents="none" style={[styles.layer, prevStyle]}>
              <PreviewLayer musicInfo={prevMusic} coverSize={coverSize} coverBottomSpace={coverBottomSpace} />
            </Animated.View>
          )
        : null}
      {dragActive && nextMusic
        ? (
            <Animated.View pointerEvents="none" style={[styles.layer, nextStyle]}>
              <PreviewLayer musicInfo={nextMusic} coverSize={coverSize} coverBottomSpace={coverBottomSpace} />
            </Animated.View>
          )
        : null}
      <Animated.View style={[styles.layer, dragStyle]}>
        {children}
      </Animated.View>
    </View>
  )
}))

const styles = createStyle({
  container: {
    flex: 1,
    // 内容跟手滑出时裁掉，不露出屏幕外
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  preview: {
    flex: 1,
  },
  previewCoverBox: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  previewInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  previewName: {
    fontWeight: '600',
  },
  previewSinger: {
    marginTop: 4,
  },
})
