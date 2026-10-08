import { memo, useEffect } from 'react'
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '@/store/theme/hook'

// 所有骨架块共享同一个呼吸动画值：保证同步，也避免每块各跑一个循环动画
const pulse = new Animated.Value(1)
let isPulseRunning = false
const startPulse = () => {
  if (isPulseRunning) return
  isPulseRunning = true
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]),
  ).start()
}

export interface SkeletonBlockProps {
  width?: ViewStyle['width']
  height?: ViewStyle['height']
  radius?: number
  style?: StyleProp<ViewStyle>
}

// 骨架块：颜色取主题中性灰阶（c-100，亮/暗主题自动适配、黑白色系下依然成立），
// 呼吸动画作用在 opacity 上（与颜色系统解耦），native driver 驱动不占 JS 线程
export default memo(({ width, height, radius = 4, style }: SkeletonBlockProps) => {
  const theme = useTheme()

  useEffect(() => {
    startPulse()
  }, [])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme['c-100'], opacity: pulse },
        style,
      ]}
    />
  )
})
