import { memo, useMemo } from 'react'

import SelectItem, { type SelectItemOption } from '../../components/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { setDesktopLyricTextPosition } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

type Y_TYPE = LX.AppSetting['desktopLyric.textPosition.y']

const Y_LIST = [
  'top',
  'center',
  'bottom',
] as const

// 桌面歌词垂直对齐：行显示当前对齐，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const y = useSettingValue('desktopLyric.textPosition.y')
  const options = useMemo<SelectItemOption<Y_TYPE>[]>(
    () => Y_LIST.map(id => ({ value: id, label: t(`setting_lyric_desktop_text_y_${id}`) })),
    [t],
  )

  const setPosition = (id: Y_TYPE) => {
    void setDesktopLyricTextPosition(null, id).then(() => {
      updateSetting({ 'desktopLyric.textPosition.y': id })
    })
  }

  return <SelectItem label={t('setting_lyric_desktop_text_y')} value={y} options={options} onChange={setPosition} />
})
