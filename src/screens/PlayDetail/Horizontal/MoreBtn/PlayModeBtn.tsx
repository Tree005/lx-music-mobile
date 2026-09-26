import { memo, useMemo } from 'react'
import { ListDashes, Prohibit, Repeat, RepeatOnce, Shuffle } from 'phosphor-react-native'
import { toast } from '@/utils/tools'
import { MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import Btn from './Btn'


export default memo(() => {
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const t = useI18n()

  const toggleNextPlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    let modeName: 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop:
        modeName = 'play_list_loop'
        break
      case MUSIC_TOGGLE_MODE.random:
        modeName = 'play_list_random'
        break
      case MUSIC_TOGGLE_MODE.list:
        modeName = 'play_list_order'
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
        modeName = 'play_single_loop'
        break
      default:
        modeName = 'play_single'
        break
    }
    toast(t(modeName))
  }

  const playModeIcon = useMemo(() => {
    let playModeIcon = null
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop:
        playModeIcon = Repeat
        break
      case MUSIC_TOGGLE_MODE.random:
        playModeIcon = Shuffle
        break
      case MUSIC_TOGGLE_MODE.list:
        playModeIcon = ListDashes
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
        playModeIcon = RepeatOnce
        break
      default:
        playModeIcon = Prohibit
        break
    }
    return playModeIcon
  }, [togglePlayMethod])

  return <Btn icon={playModeIcon} onPress={toggleNextPlayMode} />
})
