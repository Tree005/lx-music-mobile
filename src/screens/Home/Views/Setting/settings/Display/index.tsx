import { memo } from 'react'

import Section from '../../components/Section'
import IsShowBackBtn from '../Basic/IsShowBackBtn'
import IsShowExitBtn from '../Basic/IsShowExitBtn'
import IsAutoHidePlayBar from '../Basic/IsAutoHidePlayBar'
import IsEnableHorizontal from '../Basic/IsEnableHorizontal'
import IsAllowProgressBarSeek from '../Basic/IsAllowProgressBarSeek'
import IsUseSystemFileSelector from '../Basic/IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from '../Basic/IsAlwaysKeepStatusbarHeight'
import { useI18n } from '@/lang'

// 「显示与歌词」二级页的显示分组
export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_display')}>
      <IsShowBackBtn />
      <IsShowExitBtn />
      <IsAutoHidePlayBar />
      <IsEnableHorizontal />
      <IsAllowProgressBarSeek />
      <IsUseSystemFileSelector />
      <IsAlwaysKeepStatusbarHeight />
    </Section>
  )
})
