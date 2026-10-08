import { memo, useMemo } from 'react'

import SelectItem from '@/components/common/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { TRY_QUALITYS_LIST } from '@/core/music/utils'

// 音质选择：行显示当前音质，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const quality = useSettingValue('player.playQuality')
  const options = useMemo(() => {
    return ([...TRY_QUALITYS_LIST, '128k'].reverse() as LX.Quality[]).map(q => ({ value: q, label: q }))
  }, [])

  return (
    <SelectItem
      label={t('setting_play_play_quality')}
      value={quality}
      options={options}
      onChange={(v) => { updateSetting({ 'player.playQuality': v }) }}
    />
  )
})
