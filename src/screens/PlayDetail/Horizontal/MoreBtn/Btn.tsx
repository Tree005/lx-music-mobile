import { TouchableOpacity } from 'react-native'
import { type ComponentType } from 'react'
import { type IconProps } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'
import { PRESS_OPACITY } from '@/theme/motion'

export const BTN_WIDTH = scaleSizeW(32)
export const BTN_ICON_SIZE = 22

// 整页是暗色模糊底，这一列小按钮的图标统一白色
const ICON_COLOR = '#fff'

export default ({ icon, color, onPress }: {
  /** Phosphor 图标组件 */
  icon: ComponentType<IconProps>
  color?: string
  onPress: () => void
}) => {
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }} activeOpacity={PRESS_OPACITY} onPress={onPress}>
      <PhIcon Icon={icon} color={color ?? ICON_COLOR} size={BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  cotrolBtn: {
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
