import { memo, useMemo } from 'react'

import SelectItem, { type SelectItemOption } from '@/components/common/SelectItem'
import { updateSetting } from '@/core/common'
import { useMainSource } from '@/core/mainSource'
import { useI18n } from '@/lang'
import { useSourceListI18n } from '@/components/SourceSelector'

const SOURCES: LX.OnlineSource[] = ['kw', 'kg', 'wy', 'tx', 'mg']

// 主音源：行显示当前主源，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const source = useMainSource()
  const sourceNames = useSourceListI18n(SOURCES)
  const options = useMemo<SelectItemOption<LX.OnlineSource>[]>(
    () => sourceNames.map(({ label, action }) => ({ value: action as LX.OnlineSource, label })),
    [sourceNames],
  )

  return (
    <SelectItem
      label={t('setting_play_priority_source')}
      value={source}
      options={options}
      onChange={(v) => { updateSetting({ 'player.playPrioritySource': v }) }}
    />
  )
})
