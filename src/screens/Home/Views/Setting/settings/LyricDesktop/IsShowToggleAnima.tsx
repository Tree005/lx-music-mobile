import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'


import CheckBoxItem from '../../components/CheckBoxItem'
import { Sparkle } from 'phosphor-react-native'
import { setShowDesktopLyricToggleAnima } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const showToggleAnima = useSettingValue('desktopLyric.showToggleAnima')
  const update = (showToggleAnima: boolean) => {
    void setShowDesktopLyricToggleAnima(showToggleAnima).then(() => {
      updateSetting({ 'desktopLyric.showToggleAnima': showToggleAnima })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem icon={Sparkle} check={showToggleAnima} onChange={update} label={t('setting_lyric_desktop_toggle_anima')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
