import { memo, useMemo } from 'react'

import SelectItem, { type SelectItemOption } from '@/components/common/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'

type Align_Type = LX.AppSetting['playDetail.style.align']

const ALIGN_LIST = [
  'left',
  'center',
  'right',
] as const

// 歌词对齐方式：行显示当前对齐，点开弹层选择（与其他选择型设置统一）
export default memo(() => {
  const t = useI18n()
  const align = useSettingValue('playDetail.style.align')
  const options = useMemo<SelectItemOption<Align_Type>[]>(
    () => ALIGN_LIST.map(id => ({ value: id, label: t(`play_detail_setting_lrc_align_${id}`) })),
    [t],
  )

  return (
    <SelectItem
      label={t('play_detail_setting_lrc_align')}
      value={align}
      options={options}
      onChange={(v) => { updateSetting({ 'playDetail.style.align': v }) }}
    />
  )
})
