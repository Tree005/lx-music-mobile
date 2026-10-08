import { memo, useMemo } from 'react'

import SelectItem from '@/components/common/SelectItem'
import { useI18n } from '@/lang'
import { setFontSize } from '@/core/common'
import { useFontSize } from '@/store/common/hook'

const LIST = [
  {
    size: 0.8,
    name: 'setting_basic_font_size_80',
  },
  {
    size: 0.9,
    name: 'setting_basic_font_size_90',
  },
  {
    size: 1,
    name: 'setting_basic_font_size_100',
  },
  {
    size: 1.1,
    name: 'setting_basic_font_size_110',
  },
  {
    size: 1.2,
    name: 'setting_basic_font_size_120',
  },
  {
    size: 1.3,
    name: 'setting_basic_font_size_130',
  },
] as const

type SIZE_TYPE = typeof LIST[number]['size']

// 字体大小：行显示当前档位，点开弹层选择（网易云式；原「预览」文案随行内列表一起移除，字号变化全界面即时可见）
export default memo(() => {
  const t = useI18n()
  const size = useFontSize()
  const options = useMemo(() => LIST.map(item => ({ value: String(item.size), label: t(item.name) })), [t])

  return (
    <SelectItem
      label={t('setting_basic_font_size')}
      value={String(size)}
      options={options}
      onChange={(v) => { setFontSize(Number(v) as SIZE_TYPE) }}
    />
  )
})
