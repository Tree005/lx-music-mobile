import { memo } from 'react'

import Section from '../../components/Section'
import ResourceCache from './ResourceCache'
import MetaCache from './MetaCache'
import DislikeList from './DislikeList'
// 「日志」是开发向入口，先隐藏；需要时连同下方 JSX 一起取消注释
// import Log from './Log'
// import MaxCache from './MaxCache'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_other')}>
      <ResourceCache />
      <MetaCache />
      <DislikeList />
      {/* 「日志」开发向入口先隐藏 */}
      {/* <Log /> */}
      {/* <MaxCache /> */}
    </Section>
  )
})
