import { createContext, memo, forwardRef, useCallback, useContext, useImperativeHandle, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, PanResponder, View } from 'react-native'
import Image from '@/components/common/Image'
import { useWindowSize } from '@/utils/hooks'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { prefetchMusicPicUrl } from '@/utils/musicPic'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

// 横向滑动切歌的外层容器（对齐网易云的交互）：
// 滑动时主内容（歌词行/信息行/进度条/控制）完全固定不动，封面像「架子上的唱片」整张滑动——
// 当前封面整卡跟手滑出屏幕、相邻歌的封面整卡从另一侧滑入（盖着下方内容经过，不做裁剪框）；
// 松手滑够（阈值）补齐动画后真正切歌、不够回弹；切歌后下方内容原地切换，
// 预览卡片与真实封面是同一张图，卸载时无缝交接。
// 与播放条「三格轨道」同一套交互（左滑下一首、右滑上一首），全屏播放页与心动页共用。
// 预览数据由调用方提供：必须与「实际会播放的歌」一致（随机播放时用预取缓存保证）。
// 按钮点击上一首/下一首时也可以通过 ref 的 triggerSwipe 触发同款滑动动画（视觉连续）

/** 拖拽状态：滑动中为 true（真实封面订阅它隐藏自身、让卡片层接管视觉） */
export const SwipeDragContext = createContext(false)

/** 订阅当前是否在横向拖拽切歌 */
export const useSwipeDragActive = () => useContext(SwipeDragContext)

// 横向位移超过它才接管手势（避免和页面里的竖滑/点击抢）
const SWIPE_THRESHOLD = 10
// 横向意图判定：横向位移要明显大于纵向位移才接管（页面里还有上下滑看歌词的手势）
const DIRECTION_RATIO = 1.5
// 松手后的补齐 / 回弹动画时长
const SETTLE_DURATION = 180
// 提交切歌后的兜底：歌曲信息迟迟不落地也要把位移复位
const COMMIT_TIMEOUT = 1200
// 预览里没有相邻歌时的阻尼（仍可滑动切歌，只是没有「滑进来的预览」）
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

/** 后台预热相邻歌的封面地址（内部按歌曲 id 缓存、重复调用安全）：
 * 歌一变化就拉好相邻歌的封面 URL，等手指按下滑动、预览卡片挂载时大概率已就绪，
 * 不然快速滑动切到没播过的歌时，预览封面要现取 URL，来不及就露空 */
const prefetchPreviewPic = (info: LX.Music.MusicInfo | null) => {
  prefetchMusicPicUrl(info)
}

/** 滑动中的封面卡片：完整一张停在真实封面的位置上，整卡跟手位移（滑出/滑入），不做裁剪框；
 * 封面地址没就绪（还没取到/没加载完）时不渲染任何内容——不显示占位块（半透明框观感很差），
 * 图就绪后自然出现 */
const SlideCard = memo(({ pic, coverSize, coverBottomSpace, translateX }: {
  pic: string
  coverSize: number
  coverBottomSpace: number
  translateX: Animated.AnimatedInterpolation<number> | Animated.Value
}) => {
  if (!pic) return null
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={[styles.previewCoverBox, { paddingBottom: coverBottomSpace }]}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Image url={pic} style={{ width: coverSize, height: coverSize, borderRadius: PREVIEW_BORDER_RADIUS }} />
        </Animated.View>
      </View>
    </View>
  )
}, (p, n) => p.pic == n.pic && p.coverSize == n.coverSize && p.coverBottomSpace == n.coverBottomSpace)

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
  /** 当前封面地址（滑动时当前卡片从它开始滑出；无封面传空串） */
  currentPic: string
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
  currentPic,
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

  // 预览封面的地址（顶层取，hook 不能条件调用；没歌时传 undefined 内部自动空处理）
  const nextPic = useMusicPic(nextMusic ?? undefined)
  const prevPic = useMusicPic(prevMusic ?? undefined)

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

  // 封面卡片的位移（整卡滑动，位移幅度 = 屏宽，卡片盖着内容区经过，露出屏外自然裁掉）：
  // 左滑（dragX 0 → -w）：下一首的卡片从右侧屏外滑到封面位（translateX +w → 0）
  // 右滑（dragX 0 → +w）：上一首的卡片从左侧屏外滑到封面位（translateX -w → 0）
  // 当前卡片直接跟手（translateX = dragX）
  const nextCardX = useMemo(
    () => dragX.interpolate({ inputRange: [-width, 0], outputRange: [0, width], extrapolate: 'clamp' }),
    [dragX, width],
  )
  const prevCardX = useMemo(
    () => dragX.interpolate({ inputRange: [0, width], outputRange: [-width, 0], extrapolate: 'clamp' }),
    [dragX, width],
  )

  return (
    <SwipeDragContext.Provider value={dragActive}>
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* 主内容固定不动：切歌时歌词/信息/进度等原地切换 */}
        <View style={styles.layer}>
          {children}
        </View>
        {/* 滑动中的封面卡片：当前卡跟手滑出、相邻卡从屏外滑入；切歌后与真实封面（同一张图）无缝交接 */}
        {dragActive && coverSize > 0
          ? (
              <>
                <SlideCard pic={currentPic} coverSize={coverSize} coverBottomSpace={coverBottomSpace} translateX={dragX} />
                {nextMusic ? <SlideCard pic={nextPic} coverSize={coverSize} coverBottomSpace={coverBottomSpace} translateX={nextCardX} /> : null}
                {prevMusic ? <SlideCard pic={prevPic} coverSize={coverSize} coverBottomSpace={coverBottomSpace} translateX={prevCardX} /> : null}
              </>
            )
          : null}
      </View>
    </SwipeDragContext.Provider>
  )
}))

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  previewCoverBox: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
})
