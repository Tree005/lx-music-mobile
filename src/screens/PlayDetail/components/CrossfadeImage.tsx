import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { defaultHeaders } from '@/components/common/Image'

// 「快速加载」阈值（ms）：挂载后这么快就画出来的图基本是缓存命中（如滑动切歌的卡片刚展示过的图），
// 直接显示跳过淡入——淡入只对「真需要下载的图」有意义（防白），缓存图还跑淡入会有"重新加载一遍"的观感
const FAST_LOAD_THRESHOLD = 200

// 单层图：opacity 初始 0，图片加载结束后淡入到 1（动画完成后回调 onLoaded）；
// initialOpacity=1 时直接显示（垫底层：图已加载过，缓存秒出，无需动画）
// allowFastSkip=false 时禁用「快速加载直接显示」——全屏模糊背景这类大图解码快但绘制慢
// （模糊是绘制期运算），直接显示会在绘制完成前露底、随后突变，必须保留淡入盖住这段窗口
const FadeLayer = memo(({ uri, blurRadius, duration, initialOpacity, allowFastSkip, onLoaded, onError }: {
  uri: string
  blurRadius?: number
  duration: number
  initialOpacity: 0 | 1
  allowFastSkip: boolean
  onLoaded?: () => void
  onError?: () => void
}) => {
  const opacity = useRef(new Animated.Value(initialOpacity)).current
  const startedRef = useRef(false)
  const mountTimeRef = useRef(Date.now())
  const handleLoadEnd = useRef(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (allowFastSkip && Date.now() - mountTimeRef.current < FAST_LOAD_THRESHOLD) {
      // 缓存命中：直接显示（滑动交接时与卡片展示的同一张图，瞬时替换无缝）
      opacity.setValue(1)
      onLoaded?.()
      return
    }
    Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onLoaded?.()
    })
  }).current
  // 图片加载失败（外链 CDN 在设备侧偶发拒绝）：上报给容器丢弃这一层，避免留一个「永远透明的层」
  const handleError = useRef(() => { onError?.() }).current

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image
        style={StyleSheet.absoluteFill}
        source={{ uri, headers: defaultHeaders }}
        resizeMode="cover"
        blurRadius={blurRadius}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
    </Animated.View>
  )
}, (p, n) => p.uri == n.uri && p.duration == n.duration && p.allowFastSkip == n.allowFastSkip)

interface Layer { uri: string, settled: boolean }

// 封面/背景的 crossfade 容器：uri 变化时新图层叠在旧图层之上淡入，
// 显示中的图层保持挂载不挪动（挪动 = 换组件实例 = RN Image 清空重载 = 闪空白帧），
// 新层淡入完成后才裁掉更早的层。uri 为 null（封面地址还没取到）时保持当前显示的层不动。
// 淡入不依赖 RN Image 的 fadeDuration——图在缓存里时它会被跳过（切回已加载的歌就没了过渡）
export default memo(({ uri, style, blurRadius, duration = 600, allowFastSkip = true, onError, onSettled }: {
  /** 目标图片地址；null = 等待中（保持当前显示的层），'' = 明确无封面（清空显示占位） */
  uri: string | null
  /** 容器定位/尺寸样式（内部图层铺满它） */
  style: StyleProp<ViewStyle>
  blurRadius?: number
  duration?: number
  /** 是否允许「图加载极快（缓存命中）时直接显示、跳过淡入」；全屏模糊背景应传 false（大图模糊绘制慢，跳淡入会露底突变） */
  allowFastSkip?: boolean
  /** 某个图层加载失败的回调（该层会被丢弃；调用方可据此退回兜底显示） */
  onError?: (uri: string) => void
  /** 新顶层「完成显示」（淡入完成 或 缓存命中直接显示）时回调；调用方用它等「新图已上屏」再执行复位类操作 */
  onSettled?: (uri: string) => void
}) => {
  const [layers, setLayers] = useState<Layer[]>(uri ? [{ uri, settled: true }] : [])
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled
  // 供 effect 里同步判断「目标层是否已在栈内」（state 闭包拿不到最新值）
  const layersRef = useRef(layers)
  layersRef.current = layers

  useEffect(() => {
    // 空字符串 = 明确无封面（取不到）：清空层栈，露出占位——宁可空也不显示上一首的错封面；
    // null = 等待中：保持当前显示的层不动
    if (uri === '') {
      setLayers([])
      // 目标已决（清空完成）：等图类调用方不必再等
      onSettledRef.current?.('')
      return
    }
    if (!uri) return
    setLayers(prev => {
      if (prev[0]?.uri === uri) return prev
      // 只保留最近一个已完成淡入的层做垫底；中途插进来但还没显示过的层直接丢弃（无闪烁）
      const lastSettled = prev.find(l => l.settled)
      // 目标回到了「正在垫底的那张」（如滑动的预览层回退）：直接保留它——否则会同时出现
      // 两张同 uri 的层（React key 重复警告；观感上也只是无意义的自淡入）
      if (lastSettled?.uri === uri) return [lastSettled]
      return [{ uri, settled: false }, ...(lastSettled ? [lastSettled] : [])]
    })
    // 目标层已在栈内（顶层已显示 / 垫底层切换本就瞬时、无动画）：不会有新层 settle 事件，立即上报
    if (layersRef.current.some(l => l.uri === uri)) {
      onSettledRef.current?.(uri)
    }
  }, [uri])

  // 顶层（新图）淡入完成：层栈裁剪到它自己——旧层已被完全盖住，撤掉省一份渲染/模糊运算，
  // 也彻底避免旧层因任何层序问题反盖新层
  const handleLayerSettled = useCallback((layerUri: string) => {
    setLayers(prev => {
      const layer = prev.find(l => l.uri === layerUri)
      return layer ? [{ ...layer, settled: true }] : prev
    })
    // onLoaded 只在「未 settle 的新层」完成时触发：此刻新图已可见，通知调用方
    onSettledRef.current?.(layerUri)
  }, [])

  // 某个图层加载失败：丢弃它（不留「永远透明的层」），并上报给调用方
  const handleLayerError = useCallback((layerUri: string) => {
    setLayers(prev => prev.filter(l => l.uri !== layerUri))
    onError?.(layerUri)
  }, [onError])

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {
        // 反序渲染：数组是 [新层, 旧层]，RN 里后渲染的在上层——反序后旧层在下、新层在上，
        // 新图淡入时盖住旧图（顺序弄反的话旧图会永远盖住新图）
        layers.slice().reverse().map(l => (
          <FadeLayer
            key={l.uri}
            uri={l.uri}
            blurRadius={blurRadius}
            duration={duration ?? 600}
            initialOpacity={l.settled ? 1 : 0}
            allowFastSkip={allowFastSkip}
            onLoaded={l.settled ? undefined : () => { handleLayerSettled(l.uri) }}
            onError={() => { handleLayerError(l.uri) }}
          />
        ))
      }
    </View>
  )
}, (p, n) => p.uri == n.uri && p.duration == n.duration && p.blurRadius == n.blurRadius && p.allowFastSkip == n.allowFastSkip)
