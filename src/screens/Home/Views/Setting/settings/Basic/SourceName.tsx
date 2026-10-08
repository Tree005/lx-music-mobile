import { memo, useMemo } from 'react'

import Section from '../../components/Section'
import SelectItem, { type SelectItemOption } from '../../components/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type SourceNameType = LX.AppSetting['common.sourceNameType']

const setSourceNameType = (type: SourceNameType) => {
  updateSetting({ 'common.sourceNameType': type })
}

// 歌曲来源名称：行显示当前方式，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const options = useMemo<SelectItemOption<SourceNameType>[]>(() => [
    { value: 'real', label: t('setting_basic_sourcename_real') },
    { value: 'alias', label: t('setting_basic_sourcename_alias') },
  ], [t])

  return (
    <Section>
      <SelectItem label={t('setting_basic_sourcename')} value={sourceNameType} options={options} onChange={setSourceNameType} />
    </Section>
  )
})
