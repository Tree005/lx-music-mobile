import { TouchableOpacity } from 'react-native'
import { type ComponentType } from 'react'
import { type IconProps } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default ({ icon, color, onPress, onLongPress }: {
  /** Phosphor 图标组件 */
  icon: ComponentType<IconProps>
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={{ ...styles.button, width: HEADER_HEIGHT }}>
      <PhIcon Icon={icon} color={color} size={18} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
})
