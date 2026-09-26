import { memo } from 'react'
import { View } from 'react-native'

import Section from '../components/Section'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'

const currentVer = process.versions.app

// 精简后的「关于」：只保留版本号
// 上游那一大段免责声明（开源地址、谨防第三方修改版、签名不一致、许可证、作者署名等）已移除
export default memo(() => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <Section title={t('setting_about')}>
      <View style={styles.row}>
        <Text size={15} style={styles.label}>{t('version_label_current_ver')}</Text>
        <Text size={15} color={theme['c-font-label']}>{currentVer}</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingLeft: 20,
    paddingRight: 20,
  },
  label: {
    marginRight: 8,
  },
})
