import { memo } from 'react'

import Section from '../../components/Section'
import IsStartupAutoPlay from '../Basic/IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from '../Basic/IsStartupPushPlayDetailScreen'
import { useI18n } from '@/lang'

// 「播放」二级页的启动分组
export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_startup')}>
      <IsStartupAutoPlay />
      <IsStartupPushPlayDetailScreen />
    </Section>
  )
})
