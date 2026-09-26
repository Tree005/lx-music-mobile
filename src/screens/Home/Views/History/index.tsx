import { View } from 'react-native'
import { ClockCounterClockwise } from 'phosphor-react-native'

import { PhIcon } from '@/components/common/PhIcon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

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

// 占位页，暂未实现播放历史记录
export default () => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <View style={styles.container}>
      <PhIcon Icon={ClockCounterClockwise} size={48} color={theme['c-font-label']} />
      <Text style={styles.text} size={15} color={theme['c-font-label']}>{t('nav_history')}</Text>
    </View>
  )
}
