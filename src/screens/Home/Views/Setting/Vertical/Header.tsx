import { View, TouchableOpacity } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'

import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'

// 返回栏高度（不含状态栏）
const HEADER_HEIGHT_SIZE = scaleSizeH(HEADER_HEIGHT)

// 设置页自己的返回栏（设置主页 / 二级页两级都要用，所以不走通用的 SubPageHeader）
export default ({ title, onBack }: {
  title: string
  onBack: () => void
}) => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{
      ...styles.container,
      // 高度叠加状态栏，并将内容下推避免被状态栏遮挡
      height: HEADER_HEIGHT_SIZE + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-content-background'],
    }}>
      <TouchableOpacity style={styles.btn} onPress={onBack}>
        <PhIcon Icon={CaretLeft} size={20} color={theme['c-font']} />
      </TouchableOpacity>
      <Text style={styles.title} size={18} numberOfLines={1}>{title}</Text>
      {/* 右侧等宽占位，保证标题居中 */}
      <View style={styles.btn} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  btn: {
    width: HEADER_HEIGHT_SIZE,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
})
