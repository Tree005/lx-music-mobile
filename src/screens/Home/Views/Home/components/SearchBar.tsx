import { TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'

// 纯展示的搜索框，不复用 Views/Search/HeaderBar，避免把音源选择逻辑耦合到首页
// 胶囊形白底 + 浅灰描边，文字水平居中，无图标
export default () => {
  const theme = useTheme()
  const t = useI18n()

  const handlePress = () => {
    setNavActiveId('nav_search')
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        ...styles.container,
        backgroundColor: theme['c-content-background'],
        borderColor: theme['c-border-background'],
      }}
      onPress={handlePress}
    >
      <Text style={styles.tip} size={14} color={theme['c-font-label']} numberOfLines={1}>{t('home_search_tip')}</Text>
    </TouchableOpacity>
  )
}

const styles = createStyle({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  tip: {
    maxWidth: '90%',
  },
})
