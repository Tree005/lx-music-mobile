import { memo, useMemo } from 'react'

import SelectItem, { type SelectItemOption } from '@/components/common/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const setAddMusicLocationType = (type: LX.AddMusicLocationType) => {
  updateSetting({ 'list.addMusicLocationType': type })
}

// 添加歌曲到列表时的位置：行显示当前选择，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const addMusicLocationType = useSettingValue('list.addMusicLocationType')
  const options = useMemo<SelectItemOption<LX.AddMusicLocationType>[]>(() => [
    { value: 'top', label: t('setting_list_add_music_location_type_top') },
    { value: 'bottom', label: t('setting_list_add_music_location_type_bottom') },
  ], [t])

  return (
    <SelectItem
      label={t('setting_list_add_music_location_type')}
      value={addMusicLocationType}
      options={options}
      onChange={setAddMusicLocationType}
    />
  )
})
