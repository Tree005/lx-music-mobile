import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import { CursorClick } from 'phosphor-react-native'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const showExitBtn = useSettingValue('common.showExitBtn')
  const setShowExitBtn = (showExitBtn: boolean) => {
    updateSetting({ 'common.showExitBtn': showExitBtn })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem icon={CursorClick} check={showExitBtn} label={t('setting_basic_show_exit_btn')} onChange={setShowExitBtn} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
