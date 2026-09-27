import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isEnableHorizontal = useSettingValue('common.isEnableHorizontal')
  const setIsEnableHorizontal = (isEnableHorizontal: boolean) => {
    updateSetting({ 'common.isEnableHorizontal': isEnableHorizontal })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isEnableHorizontal} label={t('setting_basic_enable_horizontal')} onChange={setIsEnableHorizontal} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
