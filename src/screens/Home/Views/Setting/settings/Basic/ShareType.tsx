import { memo, useMemo } from 'react'

import SelectItem, { type SelectItemOption } from '@/components/common/SelectItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type ShareType = LX.AppSetting['common.shareType']

const setShareType = (type: ShareType) => {
  updateSetting({ 'common.shareType': type })
}

// 分享类型：行显示当前方式，点开弹层选择（网易云式）
export default memo(() => {
  const t = useI18n()
  const shareType = useSettingValue('common.shareType')
  const options = useMemo<SelectItemOption<ShareType>[]>(() => [
    { value: 'system', label: t('setting_basic_share_type_system') },
    { value: 'clipboard', label: t('setting_basic_share_type_clipboard') },
  ], [t])

  return <SelectItem label={t('setting_basic_share_type')} value={shareType} options={options} onChange={setShareType} />
})
