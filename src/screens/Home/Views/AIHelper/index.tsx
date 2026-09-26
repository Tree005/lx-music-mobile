import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { MciIcon } from '@/components/common/MciIcon'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 15,
  },
})

export default () => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <View style={styles.container}>
      <MciIcon name="robot-happy-outline" size={48} color={theme['c-font-label']} />
      <Text style={styles.text} color={theme['c-font-label']}>{t('ai_helper_placeholder')}</Text>
    </View>
  )
}
