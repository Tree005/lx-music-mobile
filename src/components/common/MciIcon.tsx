import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { scaleSizeW } from '@/utils/pixelRatio'
import { memo } from 'react'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'

// 图标名查询：https://oblador.github.io/react-native-vector-icons/
// 该组件只包装 MaterialCommunityIcons，与 IcoMoon 的 Icon 组件互不影响

interface MciIconProps {
  /**
   * 图标名，取 MaterialCommunityIcons 的图标名
   */
  name: string
  /**
   * 字体大小，默认 15，会按屏幕宽度缩放
   */
  size?: number
  /**
   * 图标颜色，默认取主题字体色
   */
  color?: string
  style?: StyleProp<TextStyle>
}

export const MciIcon = memo(({ name, size = 15, color, style }: MciIconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  // 与 Icon/Text 保持一致：开启文字阴影主题时同步给图标加阴影
  const newStyle = textShadow
    ? StyleSheet.compose({
      textShadowColor: theme['c-primary-dark-300-alpha-800'],
      textShadowOffset: { width: 0.2, height: 0.2 },
      textShadowRadius: 2,
    }, style)
    : style
  return (
    <MaterialCommunityIcons
      name={name}
      size={scaleSizeW(size)}
      color={color ?? theme['c-font']}
      // @ts-expect-error
      style={newStyle}
    />
  )
})
