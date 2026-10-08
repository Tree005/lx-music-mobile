import { memo, useMemo } from 'react'

import SelectItem from '../../components/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n, langList } from '@/lang'
import { setLanguage } from '@/core/common'

// 语言：行显示当前语言，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const langId = useSettingValue('common.langId')
  const options = useMemo(() => langList.map(({ locale, name }) => ({ value: locale, label: name })), [])

  // 存储值可能为 null（跟随系统判定前的初始态），按默认语言显示
  return <SelectItem label={t('setting_basic_lang')} value={langId ?? 'zh_cn'} options={options} onChange={setLanguage} />
})
