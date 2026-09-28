import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { defaultHeaders } from '@/components/common/Image'

// 单层图：opacity 初始 0，图片加载结束后淡入到 1（动画完成后回调 onLoaded）；
// initialOpacity=1 时直接显示（垫底层：图已加载过，缓存秒出，无需动画）
const FadeLayer = memo(({ uri, blurRadius, duration, initialOpacity, onLoaded }: {
  uri: string
  blurRadius?: number
  duration: number
  initialOpacity: 0 | 1
  onLoaded?: () => void
}) => {
  const opacity = useRef(new Animated.Value(initialOpacity)).current
  const startedRef = useRef(false)
  const handleLoadEnd = useRef(() => {
    if (startedRef.current) return
    startedRef.current = true
    Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onLoaded?.()
    })
  }).current

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image
        style={StyleSheet.absoluteFill}
        source={{ uri, headers: defaultHeaders }}
        resizeMode="cover"
        blurRadius={blurRadius}
        onLoadEnd={handleLoadEnd}
      />
    </Animated.View>
  )
}, (p, n) => p.uri == n.uri && p.duration == n.duration)

interface Layer { uri: string, settled: boolean }

// 封面/背景的 crossfade 容器：uri 变化时新图层叠在旧图层之上淡入，
// 显示中的图层保持挂载不挪动（挪动 = 换组件实例 = RN Image 清空重载 = 闪空白帧），
// 新层淡入完成后才裁掉更早的层。uri 为 null（封面地址还没取到）时保持当前显示的层不动。
// 淡入不依赖 RN Image 的 fadeDuration——图在缓存里时它会被跳过（切回已加载的歌就没了过渡）
export default memo(({ uri, style, blurRadius, duration = 600 }: {
  /** 目标图片地址；null 表示暂无（保持当前显示的层） */
  uri: string | null
  /** 容器定位/尺寸样式（内部图层铺满它） */
  style: StyleProp<ViewStyle>
  blurRadius?: number
  duration?: number
}) => {
  const [layers, setLayers] = useState<Layer[]>(uri ? [{ uri, settled: true }] : [])

  useEffect(() => {
    if (!uri) return
    setLayers(prev => {
      if (prev[0]?.uri === uri) return prev
      // 只保留最近一个已完成淡入的层做垫底；中途插进来但还没显示过的层直接丢弃（无闪烁）
      const lastSettled = prev.find(l => l.settled)
      return [{ uri, settled: false }, ...(lastSettled ? [lastSettled] : [])]
    })
  }, [uri])

  // 顶层淡入完成：标记 settled（此后它作为垫底层保持显示，直到下次切换）
  const handleLayerSettled = useCallback((layerUri: string) => {
    setLayers(prev => prev.map(l => l.uri === layerUri ? { ...l, settled: true } : l))
  }, [])

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {
        layers.map(l => (
          <FadeLayer
            key={l.uri}
            uri={l.uri}
            blurRadius={blurRadius}
            duration={duration ?? 600}
            initialOpacity={l.settled ? 1 : 0}
            onLoaded={l.settled ? undefined : () => { handleLayerSettled(l.uri) }}
          />
        ))
      }
    </View>
  )
}, (p, n) => p.uri == n.uri && p.duration == n.duration && p.blurRadius == n.blurRadius)
