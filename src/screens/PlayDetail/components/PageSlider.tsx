import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, PanResponder, View } from 'react-native'
import { createStyle } from '@/utils/tools'

// 竖向两页的翻页容器（封面页 / 歌词页），用来替代 PagerView：
// PagerView（ViewPager2）的原生触摸拦截会把左右滑切歌的手势打断（实测：每次 claim 都被 terminate）。
// 实现：两页纵向排在一条轨道上，封面页支持「上滑跟手」（拖动轨道平移，松手过阈值翻页、否则回弹）；
// 歌词页在首次翻到时才挂载（FlatList 挂载即部分可见，避免在不可见状态初始化失败），
// 挂载后常驻（切回封面再进来不用重挂）；歌词→封面的返回用点击（歌词列表自己的滚动不受影响）。
// 注意：横向滑动切歌由外层 SwipeSongContainer 负责，本容器只认纵向（方向判定互斥，天然协调）

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))
// 上滑翻页的判定阈值（拖动距离超过页高的这个比例就翻页）
const PAGE_FLIP_RATIO = 0.22
// 翻页补间动画时长
const FLIP_DURATION = 200

export interface PageSliderProps {
  /** 当前页（0 起，受控） */
  page: number
  /** 容器高度实测回调（调用方用它算封面可用高度） */
  onHeightChange?: (height: number) => void
  /** 拖动翻页完成（page 已落到目标页）时回调 */
  onDragSettled?: (page: number) => void
  /** 是否允许拖动跟手（封面页 true；歌词页交给列表滚动，传 false） */
  canDrag?: boolean
  /** 每项一页 */
  children: ReactNode[]
}

export default memo(({ page, onHeightChange, onDragSettled, canDrag = true, children }: PageSliderProps) => {
  const [height, setHeight] = useState(0)
  // 歌词页是否已被翻到过（首次翻到才挂载，之后常驻）
  const [everShowedPage1, setEverShowedPage1] = useState(false)
  const translateY = useRef(new Animated.Value(0)).current
  const draggingRef = useRef(false)
  const startYRef = useRef(0)
  const pageRef = useRef(0)
  // canDrag 通过 ref 取最新（panResponder 只创建一次）
  const canDragRef = useRef(canDrag)
  canDragRef.current = canDrag
  const dragSettledRef = useRef(onDragSettled)
  dragSettledRef.current = onDragSettled

  // 命令式翻页（点击/外部 setState）：动画到目标页
  useEffect(() => {
    if (height <= 0) return
    if (page > 0) setEverShowedPage1(true)
    if (pageRef.current == page) return
    pageRef.current = page
    Animated.timing(translateY, {
      toValue: -page * height,
      duration: FLIP_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  // onDragSettled 只在拖动链路使用
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, height])

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      canDragRef.current && Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
    onPanResponderGrant: () => {
      draggingRef.current = true
      translateY.stopAnimation((value: number) => { startYRef.current = value })
    },
    onPanResponderMove: (_, g) => {
      if (!height) return
      let dy = g.dy
      // 只允许往上拖（进歌词）；往下拖（回不到封面之外）加阻尼
      if (dy > 0) dy *= 0.3
      translateY.setValue(clamp(startYRef.current + dy, -height, 0))
    },
    onPanResponderRelease: (_, g) => {
      draggingRef.current = false
      if (!height) return
      const finalY = clamp(startYRef.current + (g.dy > 0 ? g.dy * 0.3 : g.dy), -height, 0)
      if (finalY <= -height * PAGE_FLIP_RATIO) {
        // 翻到歌词页：补齐动画后通知父组件同步状态
        setEverShowedPage1(true)
        Animated.timing(translateY, {
          toValue: -height,
          duration: FLIP_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) dragSettledRef.current?.(1)
        })
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: FLIP_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start()
      }
    },
    onPanResponderTerminate: () => {
      draggingRef.current = false
      Animated.timing(translateY, {
        toValue: pageRef.current * -height,
        duration: FLIP_DURATION,
        useNativeDriver: false,
      }).start()
    },
  }), [height, translateY])

  const trackStyle = useMemo(() => ({ transform: [{ translateY }] }), [translateY])

  return (
    <View
      style={styles.container}
      {...panResponder.panHandlers}
      onLayout={({ nativeEvent }) => {
        const h = nativeEvent.layout.height
        setHeight(h)
        onHeightChange?.(h)
      }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        {/* 封面页：常驻 */}
        <View style={[styles.page, { height }]} collapsable={false}>{children[0]}</View>
        {/* 歌词页：首次翻到才挂载（FlatList 需要在可见状态下初始化），之后常驻 */}
        {everShowedPage1
          ? <View style={[styles.page, { height }]} collapsable={false}>{children[1]}</View>
          : null}
      </Animated.View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'column',
  },
  page: {
    width: '100%',
  },
})
