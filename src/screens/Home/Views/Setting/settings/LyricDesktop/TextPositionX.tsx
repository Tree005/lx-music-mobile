import { memo, useMemo } from 'react'

import SelectItem, { type SelectItemOption } from '../../components/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { setDesktopLyricTextPosition } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

type X_TYPE = LX.AppSetting['desktopLyric.textPosition.x']

const X_LIST = [
  'left',
  'center',
  'right',
] as const

// 桌面歌词水平对齐：行显示当前对齐，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const x = useSettingValue('desktopLyric.textPosition.x')
  const options = useMemo<SelectItemOption<X_TYPE>[]>(
    () => X_LIST.map(id => ({ value: id, label: t(`setting_lyric_desktop_text_x_${id}`) })),
    [t],
  )

  const setPosition = (id: X_TYPE) => {
    void setDesktopLyricTextPosition(id, null).then(() => {
      updateSetting({ 'desktopLyric.textPosition.x': id })
    })
  }

  return <SelectItem label={t('setting_lyric_desktop_text_x')} value={x} options={options} onChange={setPosition} />
})
