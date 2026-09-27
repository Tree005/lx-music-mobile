import { TouchableOpacity } from 'react-native'
import { type ComponentType } from 'react'
import { type IconProps } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

import { HEADER_HEIGHT } from '@/config/constant'
export const BTN_WIDTH = scaleSizeW(HEADER_HEIGHT)
export const BTN_ICON_SIZE = 20

// 整页是暗色模糊底，图标统一白色
const ICON_COLOR = '#fff'

export default ({ icon, size, color, onPress, onLongPress }: {
  /** Phosphor 图标组件 */
  icon: ComponentType<IconProps>
  size?: number
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }} activeOpacity={0.5} onPress={onPress} onLongPress={onLongPress}>
      <PhIcon Icon={icon} color={color ?? ICON_COLOR} size={size ?? BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  cotrolBtn: {
    // marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
