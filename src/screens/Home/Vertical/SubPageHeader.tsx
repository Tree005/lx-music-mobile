import { View, TouchableOpacity } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT, TAB_OF_ID, type NAV_ID_Type } from '@/config/constant'

// 返回栏高度（不含状态栏）
const HEADER_HEIGHT_SIZE = scaleSizeH(HEADER_HEIGHT)

// 子页面顶栏：左侧返回箭头回到所属底部 Tab，中间居中显示页面标题
const SubPageHeader = ({ id }: { id: NAV_ID_Type }) => {
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  // 返回到当前子页面所属的底部 Tab
  const back = () => {
    setNavActiveId(TAB_OF_ID[id])
  }

  return (
    <View style={{
      ...styles.container,
      // 高度叠加状态栏，并将内容下推避免被状态栏遮挡
      height: HEADER_HEIGHT_SIZE + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-content-background'],
    }}>
      {/* 左侧返回按钮 */}
      <TouchableOpacity style={styles.btn} onPress={back}>
        <PhIcon Icon={CaretLeft} size={20} color={theme['c-font']} />
      </TouchableOpacity>
      {/* 居中标题 */}
      <Text style={styles.title} size={18} numberOfLines={1}>{t(id)}</Text>
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

export default SubPageHeader
