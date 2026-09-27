import { memo, useRef } from 'react'
import { View } from 'react-native'
import { DotsThree, SlidersHorizontal, TextAa } from 'phosphor-react-native'
import Btn, { HEADER_HEIGHT } from './Btn'
import TimeoutExitBtn, { ICON_OFF, ICON_ON } from './TimeoutExitBtn'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import MorePopup, { type MorePopupType } from './MorePopup'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import { toggleDesktopLyricLock } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import settingState from '@/store/setting/state'
import { createStyle } from '@/utils/tools'

// 桌面歌词开关：点按开关悬浮歌词，长按切换锁定
const DesktopLyricBtn = () => {
  const enabledLyric = useSettingValue('desktopLyric.enable')
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)

  const handleToggle = () => {
    desktopLyricEnableRef.current?.setEnabled(!enabledLyric)
  }
  const handleToggleLock = () => {
    const isLock = !settingState.setting['desktopLyric.isLock']
    void toggleDesktopLyricLock(isLock).then(() => {
      updateSetting({ 'desktopLyric.isLock': isLock })
    })
  }

  return (
    <>
      <Btn icon={TextAa} color={enabledLyric ? ICON_ON : ICON_OFF} onPress={handleToggle} onLongPress={handleToggleLock} />
      <DesktopLyricEnable ref={desktopLyricEnableRef} />
    </>
  )
}

// 播放页底部工具栏：桌面歌词 / 定时关闭 / 设置 / 更多（⋯ 里放后续不常用的功能）
export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const morePopupRef = useRef<MorePopupType>(null)

  return (
    <View style={styles.container}>
      <DesktopLyricBtn />
      <TimeoutExitBtn />
      <Btn icon={SlidersHorizontal} color={ICON_ON} onPress={() => { popupRef.current?.show() }} />
      <Btn icon={DotsThree} color={ICON_ON} onPress={() => { morePopupRef.current?.show() }} />
      <SettingPopup ref={popupRef} direction="vertical" />
      <MorePopup ref={morePopupRef} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
  },
})
