import { memo } from 'react'

import Section from '../../components/Section'
import Theme from '../Theme'
import Language from '../Basic/Language'
import FontSize from '../Basic/FontSize'
import ShareType from '../Basic/ShareType'
import { useI18n } from '@/lang'

// 「显示与歌词」二级页的外观分组
export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_appearance')}>
      <Theme />
      <Language />
      <FontSize />
      <ShareType />
    </Section>
  )
})
