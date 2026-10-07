import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

// 封面「收缩/展开」动画（暂停、滑动拖动时收缩；播放态展开）。
// 缩小幅度按用户确认的 0.85；封面卡与 Pic 兜底占位同尺寸同位置，
// 用同一个动画值缩放后保持同心，不会露出错位边框。
const SCALE_SHRUNK = 0.85
const SCALE_EXPANDED = 1
const SCALE_DURATION = 260

/**
 * 封面缩放动画值：shrink=true 收缩到 0.85，false 展开回 1。
 * 返回可直接用于 transform: [{ scale }]（native driver，与跟手位移的 JS 驱动互不干扰）
 */
export default (shrink: boolean) => {
  const scale = useRef(new Animated.Value(shrink ? SCALE_SHRUNK : SCALE_EXPANDED)).current
  useEffect(() => {
    Animated.timing(scale, {
      toValue: shrink ? SCALE_SHRUNK : SCALE_EXPANDED,
      duration: SCALE_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [shrink, scale])
  return scale
}
