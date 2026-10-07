import { memo, forwardRef, useCallback, useImperativeHandle, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, Image, PanResponder, StyleSheet, View } from 'react-native'
import { defaultHeaders } from '@/components/common/Image'
import { setMusicPreviewPic } from '@/core/player/musicPreviewPic'
import { useWindowSize } from '@/utils/hooks'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { prefetchMusicPicUrl } from '@/utils/musicPic'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'
import CrossfadeImage from './CrossfadeImage'

// 横向滑动切歌的外层容器（对齐网易云的交互）：
// 滑动时主内容（歌词行/信息行/进度条/控制）完全固定不动，封面像「架子上的唱片」整张滑动——
// 当前封面整卡跟手滑出屏幕、相邻歌的封面整卡从另一侧滑入（盖着下方内容经过，不做裁剪框）；
// 松手滑够（阈值）补齐动画后真正切歌、不够回弹；切歌后下方内容原地切换。
// 封面是「单层显示」：当前封面的 crossfade 就在当前卡里（平时显示、滑动时整卡移走），
// 不存在「图片层与卡片层的交接」——没有任何交接闪烁/占位残影。
// 三张卡常驻挂载：相邻卡的图在滑动前就已加载/绘制完成，滑动时只有纯位移动画。
// 与播放条「三格轨道」同一套交互（左滑下一首、右滑上一首），全屏播放页与心动页共用。
// 预览数据由调用方提供：必须与「实际会播放的歌」一致（随机播放时用预取缓存保证）。
// 按钮点击上一首/下一首时也可以通过 ref 的 triggerSwipe 触发同款滑动动画（视觉连续）

// 当前封面的 crossfade 淡入时长（ms）：图就绪得快（缓存命中）时会直接显示、跳过淡入
const CURRENT_FADE_DURATION = 300

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

/** 相邻歌的封面卡片：完整一张停在封面位置上，整卡跟手位移（滑出/滑入）；
 * 封面地址没就绪（还没取到/没加载完）时不渲染任何内容——不显示占位块（半透明框观感很差） */
const SlideCard = memo(({ pic, coverSize, coverBottomSpace, translateX, coverScale }: {
  pic: string | null
  coverSize: number
  coverBottomSpace: number
  translateX: Animated.AnimatedInterpolation<number> | Animated.Value
  coverScale?: Animated.Value
}) => {
  if (!pic) return null
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={[styles.previewCoverBox, { paddingBottom: coverBottomSpace }]}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          {/* 缩放与位移分开两层：transform 组合顺序不受数组写法影响 */}
          <Animated.View style={coverScale ? { transform: [{ scale: coverScale }] } : null}>
            {/* 用原生 Image 而不是共享组件：图加载失败时保持空白（透出背景），不显示浅色占位框 */}
            <Image
              source={{ uri: pic, headers: defaultHeaders }}
              resizeMode="cover"
              style={{ width: coverSize, height: coverSize, borderRadius: PREVIEW_BORDER_RADIUS }}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  )
}, (p, n) => p.pic == n.pic && p.coverSize == n.coverSize && p.coverBottomSpace == n.coverBottomSpace && p.coverScale == n.coverScale)

/** 当前封面的卡片：常驻显示（封面唯一的显示层），crossfade 内置——
 * 切歌/封面回填的淡入过渡都在它内部完成；「图加载极快（缓存命中）」时直接显示跳过淡入，
 * 滑动切歌就是「同一块封面直接停到位置」，无任何二次渲染/交接
 * （没封面传空串：uri=null 内部会保持当前显示的层，等新图） */
const CurrentCard = memo(({ pic, coverSize, coverBottomSpace, translateX, coverScale, onSettled, onError }: {
  pic: string
  coverSize: number
  coverBottomSpace: number
  translateX: Animated.AnimatedInterpolation<number> | Animated.Value
  coverScale?: Animated.Value
  onSettled?: (uri: string) => void
  onError?: (uri: string) => void
}) => {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={[styles.previewCoverBox, { paddingBottom: coverBottomSpace }]}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Animated.View style={[{ width: coverSize, height: coverSize, borderRadius: PREVIEW_BORDER_RADIUS, overflow: 'hidden' }, coverScale ? { transform: [{ scale: coverScale }] } : null]}>
            <CrossfadeImage uri={pic || null} style={StyleSheet.absoluteFill} duration={CURRENT_FADE_DURATION} onSettled={onSettled} onError={onError} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  )
}, (p, n) => p.pic == n.pic && p.coverSize == n.coverSize && p.coverBottomSpace == n.coverBottomSpace && p.coverScale == n.coverScale)

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
  /** 是否允许横向滑动切歌（歌词页传 false：歌词页上滑封面会和歌词冲突，此时禁用切歌并隐藏封面卡） */
  canSwipe?: boolean
  /** 翻页轨道的纵向位移值（与 PageSlider 共享，让封面卡跟随翻页一起上移；不传则不跟随） */
  pageOffset?: Animated.Value
  /** 封面缩放动画值（暂停/滑动时缩小）；不传则不缩放 */
  coverScale?: Animated.Value
  /** 拖拽态变化回调：调用方用它把「拖动中」合成进缩放条件（拖动中就缩小） */
  onDragStateChange?: (dragging: boolean) => void
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
  canSwipe = true,
  pageOffset,
  coverScale,
  onDragStateChange,
}, ref) => {
  const { width } = useWindowSize()
  const [nextMusic, setNextMusic] = useState<LX.Music.MusicInfo | null>(null)
  const [prevMusic, setPrevMusic] = useState<LX.Music.MusicInfo | null>(null)
  // 预览层只在拖动期间挂载（平时不占渲染开销、不请求相邻歌封面）
  const [dragActive, setDragActive] = useState(false)
  // 统一拖拽态入口：同步通知调用方（替代 setDragActive 直接调用；调用的缩放条件要用「拖动中」）
  const onDragStateChangeRef = useRef(onDragStateChange)
  onDragStateChangeRef.current = onDragStateChange
  const setDrag = useCallback((v: boolean) => {
    setDragActive(v)
    onDragStateChangeRef.current?.(v)
  }, [])

  const dragX = useRef(new Animated.Value(0)).current
  const startXRef = useRef(0)
  const committedRef = useRef(false)
  const lastCommitTimeRef = useRef(0)
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextReqRef = useRef(0)
  // 手势回调只创建一次，宽度 / 相邻歌 / 封面参数通过 ref 取最新值
  const stateRef = useRef({ width: 0, canNext: false, canPrev: false, coverSize: 0, coverSpace: 0, canSwipe: true, nextPic: null as string | null, prevPic: null as string | null })
  stateRef.current.width = width
  stateRef.current.canNext = !!nextMusic
  stateRef.current.canPrev = !!prevMusic
  stateRef.current.coverSize = coverSize
  stateRef.current.coverSpace = coverBottomSpace
  stateRef.current.canSwipe = canSwipe

  // 滑动期间冻结卡片的尺寸/位置参数（用按下瞬间的值）：切歌过程会让「歌词+信息区」高度
  // 实测值波动（歌词行变化），卡片若跟着变会跳大小/跳位置——冻结后卡片严格停在真实封面的位置上。
  // 冻结值在 grant/triggerSwipe 里经 stateRef 同步记录（不留 effect 时序差）
  const frozenRef = useRef<{ size: number, space: number } | null>(null)
  useEffect(() => {
    if (!dragActive) frozenRef.current = null
  }, [dragActive])
  const cardSize = frozenRef.current?.size ?? coverSize
  const cardSpace = frozenRef.current?.space ?? coverBottomSpace

  // 预览封面的地址（顶层取，hook 不能条件调用；没歌时传 undefined 内部自动空处理）
  const nextPic = useMusicPic(nextMusic ?? undefined)
  const prevPic = useMusicPic(prevMusic ?? undefined)
  stateRef.current.nextPic = nextPic
  stateRef.current.prevPic = prevPic

  // 切歌交接的「等图复位」（修复切歌一闪）：commit 后让「滑进来的卡」直接停在中位充当当前封面，
  // 等当前卡的新封面真正上屏（CrossfadeImage onSettled）再复位——复位时新图已在，旧图没有露脸窗口。
  // sealedPreview = 冻结的滑入卡内容（等图期间预览刷新不改它），direction 决定停在哪一侧
  const [sealedPreview, setSealedPreview] = useState<{ music: LX.Music.MusicInfo, direction: 1 | -1 } | null>(null)
  const sealedPic = useMusicPic(sealedPreview?.music)
  const pendingRevealRef = useRef(false)
  // commit 时读取当时视觉上占中位的预览歌（不依赖 state，避免重建 panResponder）
  const sealSourceRef = useRef({ next: null as LX.Music.MusicInfo | null, prev: null as LX.Music.MusicInfo | null })
  sealSourceRef.current.next = nextMusic
  sealSourceRef.current.prev = prevMusic

  // 滑动方向（0=没在滑）：方向一确定就把「将要滑进来的那张封面」上报给背景，
  // 让背景提前开始慢渐变（把变化摊开在滑动过程里）；回弹 / 切歌完成后清空、回落真实封面
  const [previewDir, setPreviewDir] = useState<0 | 1 | -1>(0)
  useEffect(() => {
    if (!previewDir) return
    setMusicPreviewPic(previewDir === 1 ? nextPic : prevPic)
  }, [previewDir, nextPic, prevPic])
  const clearPreview = useCallback(() => {
    setPreviewDir(0)
    setMusicPreviewPic(null)
  }, [])

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

  // 复位（滑动交接的收尾）：位移归零、拖拽态落下、清背景预览上报、清 seal。
  // 幂等：等图复位（onSettled）、currentKey 复位、commit 兜底三条路径共用
  const revealNow = useCallback(() => {
    pendingRevealRef.current = false
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current)
      commitTimerRef.current = null
    }
    committedRef.current = false
    setSealedPreview(null)
    setDrag(false)
    dragX.stopAnimation()
    dragX.setValue(0)
    startXRef.current = 0
    // 切歌已落地：清掉背景的预览上报（此时背景目标自然接到新歌的真实封面）
    clearPreview()
  }, [dragX, clearPreview, setDrag])

  // 容器滑到位后真正切歌；等当前卡的新封面就绪（或超时）再把位移复位——
  // 此刻新图已上屏，复位在视觉上等于「同一张封面停在原位」，旧图没有露脸窗口。
  // 复位时同步把手势基值归零：若此刻手指还按着（快速连滑），后续 move 会从 0 重新跟手，不会跳变
  const commit = useCallback((direction: 1 | -1) => {
    if (committedRef.current) return
    committedRef.current = true
    lastCommitTimeRef.current = Date.now()
    // 冻结滑入卡：仅当此刻中位真的停着一张封面（有图）才走「等图复位」；
    // 无图时（地址没取到/列表到头）立即复位更快，维持原行为
    const sealMusic = direction == 1 ? sealSourceRef.current.next : sealSourceRef.current.prev
    const sealPicNow = direction == 1 ? stateRef.current.nextPic : stateRef.current.prevPic
    if (sealMusic && sealPicNow) {
      pendingRevealRef.current = true
      setSealedPreview({ music: sealMusic, direction })
    }
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    // 总兜底：歌曲信息迟迟不落地 / 新图迟迟不就绪（或同图无 settle 事件），也要把位移复位
    commitTimerRef.current = setTimeout(() => {
      if (!committedRef.current) return
      revealNow()
    }, COMMIT_TIMEOUT)
    if (direction == 1) onSwipeNext()
    else onSwipePrev()
  }, [onSwipeNext, onSwipePrev, revealNow])

  // 歌变了：通常在此刻复位（提交切歌后，新内容在视觉上就「停」在中间位置）——
  // 但提交切歌且中位停着滑入卡时，推迟到「当前卡新图已上屏」（onSettled 或兜底超时），避免交接间隙露旧图
  useLayoutEffect(() => {
    if (!committedRef.current) return
    if (pendingRevealRef.current) return
    revealNow()
  }, [currentKey, revealNow])

  // 当前卡的新封面完成显示（淡入完成或缓存直显）：等图复位在此提前收尾
  const handleCurrentSettled = useCallback(() => {
    if (!pendingRevealRef.current) return
    revealNow()
  }, [revealNow])

  // 当前卡的新封面加载失败（层被丢弃，等也有不了）：等图复位也在此收尾（露出垫底/占位）
  const handleCurrentError = useCallback(() => {
    if (!pendingRevealRef.current) return
    revealNow()
  }, [revealNow])

  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    // 组件销毁（如心动页挂起态被替换）时兜底清掉预览上报，避免背景停在邻歌封面上
    setMusicPreviewPic(null)
  }, [])

  // 程序化触发：点击上一首/下一首按钮时的滑动视觉（滑出 → 提交切歌 → 歌变化复位）
  const triggerSwipe = useCallback((direction: 1 | -1) => {
    if (committedRef.current) return
    // 歌词页禁用（同手势：卡片隐藏时按钮也不该触发滑动视觉）
    if (!stateRef.current.canSwipe) return
    // 限速：短时间连点按钮直接忽略
    if (Date.now() - lastCommitTimeRef.current < SWITCH_THROTTLE) return
    const w = stateRef.current.width
    if (!w) {
      commit(direction)
      return
    }
    refreshNext()
    refreshPrev()
    // 按钮触发的滑动也上报预览封面（背景与手势滑动同样提前渐变）
    setPreviewDir(direction)
    // 同步冻结卡片的尺寸/位置（用触发瞬间的实测值）
    frozenRef.current = { size: stateRef.current.coverSize, space: stateRef.current.coverSpace }
    setDrag(true)
    const target = direction == 1 ? -w : w
    Animated.timing(dragX, {
      toValue: target,
      duration: TRIGGER_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) commit(direction)
    })
  }, [commit, dragX, refreshNext, refreshPrev, setDrag])

  useImperativeHandle(ref, () => ({ triggerSwipe }), [triggerSwipe])

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // 歌词页（canSwipe=false）不接管横向手势：此时封面卡隐藏，滑动切歌会和歌词冲突
        if (!stateRef.current.canSwipe) return false
        // 横向意图：接管（切歌跟手）；纵向手势由内层 PageSlider 自己处理
        return Math.abs(g.dx) > SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy) * DIRECTION_RATIO
      },
      onPanResponderGrant: () => {
        // 手势开始时再取一次相邻歌（开播等时机会把预取结果清掉，这里保证滑进来的与实际一致）
        refreshNext()
        refreshPrev()
        // 同步冻结卡片的尺寸/位置（用按下瞬间的实测值）
        frozenRef.current = { size: stateRef.current.coverSize, space: stateRef.current.coverSpace }
        setDrag(true)
        dragX.stopAnimation((value: number) => { startXRef.current = value })
      },
      onPanResponderMove: (_, g) => {
        const w = stateRef.current.width
        if (!w) return
        let dx = g.dx
        // 该方向没有相邻歌时加阻尼：仍可以滑动切歌，只是没有「滑进来的预览」
        if ((dx < 0 && !stateRef.current.canNext) || (dx > 0 && !stateRef.current.canPrev)) dx *= NO_PREVIEW_DAMPING
        // 方向确定：上报「将要滑进来的封面」给背景提前渐变（方向翻转会自然改报另一侧）
        if (dx) setPreviewDir(dx < 0 ? 1 : -1)
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
        else {
          // 没滑够（回弹）：背景的预览渐变也回退
          clearPreview()
          settle(0, () => { setDrag(false) })
        }
      },
      onPanResponderTerminate: () => {
        clearPreview()
        settle(0, () => { setDrag(false) })
      },
    })
  }, [dragX, refreshNext, refreshPrev, commit, settle, clearPreview, setDrag])

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
    // 封面卡常驻挂载（不只在拖拽时渲染）：相邻卡的图在滑动前就已加载/绘制完成，
    // 滑动时只有纯位移动画——没有「图滑过来了才开始渲染」的卡顿感（对齐网易云的组件预渲染方式）；
    // current 卡是封面唯一的显示层（平时显示、滑动时整卡移走），尺寸/位置用滑动开始瞬间冻结的值
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 主内容固定不动：切歌时歌词/信息/进度等原地切换 */}
      <View style={styles.layer}>
        {children}
      </View>
      {/* 歌词页（canSwipe=false）隐藏全部卡片：歌词页是独立的全屏内容，封面卡会与它冲突；
          卡片层整体跟随翻页轨道位移（pageOffset）：上滑看歌词时封面跟手翻走，翻完正好在屏幕外、隐藏无感 */}
      {cardSize > 0 && canSwipe
        ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.layer, pageOffset ? { transform: [{ translateY: pageOffset }] } : null]}
            >
              <CurrentCard
                pic={currentPic}
                coverSize={cardSize}
                coverBottomSpace={cardSpace}
                translateX={dragX}
                coverScale={coverScale}
                onSettled={handleCurrentSettled}
                onError={handleCurrentError}
              />
              {/* 等图复位期间（sealedPreview 存在）：中位卡片用冻结的内容（刚滑进来的那首），预览刷新不改它 */}
              {nextMusic != null || sealedPreview?.direction === 1
                ? (
                    <SlideCard
                      pic={sealedPreview?.direction === 1 ? sealedPic : nextPic}
                      coverSize={cardSize}
                      coverBottomSpace={cardSpace}
                      translateX={nextCardX}
                      coverScale={coverScale}
                    />
                  )
                : null}
              {prevMusic != null || sealedPreview?.direction === -1
                ? (
                    <SlideCard
                      pic={sealedPreview?.direction === -1 ? sealedPic : prevPic}
                      coverSize={cardSize}
                      coverBottomSpace={cardSpace}
                      translateX={prevCardX}
                      coverScale={coverScale}
                    />
                  )
                : null}
            </Animated.View>
          )
        : null}
    </View>
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
