import { memo, type ComponentType } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { type IconProps, type IconWeight } from 'phosphor-react-native'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW } from '@/utils/pixelRatio'

interface PhIconProps {
  /** Phosphor 图标组件，例如 MagnifyingGlass、Play */
  Icon: ComponentType<IconProps>
  /** 尺寸，默认 20，会按屏幕宽度缩放 */
  size?: number
  /** 颜色，默认取主题字体色 */
  color?: string
  /** 字重：thin / light / regular / bold / fill / duotone，默认 regular */
  weight?: IconWeight
  style?: StyleProp<ViewStyle>
}

// Phosphor 图标薄封装：统一尺寸缩放与默认主题色
// 图标名查询：https://phosphoricons.com/
export const PhIcon = memo(({ Icon, size = 20, color, weight = 'regular', style }: PhIconProps) => {
  const theme = useTheme()

  return <Icon size={scaleSizeW(size)} color={color ?? theme['c-font']} weight={weight} style={style} />
})
