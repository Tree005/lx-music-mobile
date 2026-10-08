import { memo, useEffect, useRef, type ReactNode } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'

import { DURATION, EASING } from '@/theme/motion'

interface FadeInViewProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** 淡入时长（默认 base 200ms） */
  duration?: number
}

// 挂载时整体淡入：用于「骨架 → 内容」切换的软化（内容分支包一层即可），
// 也适用于任何「出现时想要一个轻过渡」的块
const FadeInView = ({ children, style, duration = DURATION.base }: FadeInViewProps) => {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration, easing: EASING.standard, useNativeDriver: true }).start()
  }, [opacity, duration])

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
}

export default memo(FadeInView)
