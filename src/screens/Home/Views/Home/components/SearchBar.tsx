import { TouchableOpacity } from 'react-native'
import { MagnifyingGlass } from 'phosphor-react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'

// 顶部搜索框：浅灰胶囊 + 左侧放大镜 + 提示文字
// 整条可点，点击进入搜索页
export default () => {
  const theme = useTheme()
  const t = useI18n()

  const handlePress = () => {
    setNavActiveId('nav_search')
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{ ...styles.container, backgroundColor: theme['c-200'] }}
      onPress={handlePress}
    >
      <PhIcon Icon={MagnifyingGlass} size={18} color={theme['c-font-label']} />
      <Text style={styles.tip} size={14} color={theme['c-font-label']} numberOfLines={1}>{t('home_search_tip')}</Text>
    </TouchableOpacity>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    marginTop: 8,
    marginLeft: 16,
    marginRight: 16,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 19,
  },
  tip: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
})
