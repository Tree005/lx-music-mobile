import { memo, useRef } from 'react'

import { View, StyleSheet, TouchableOpacity } from 'react-native'

import { CaretLeft, SlidersHorizontal } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { pop } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import Btn from './Btn'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import DesktopLyricBtn from './DesktopLyricBtn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

// 整页是暗色模糊底，标题与图标统一用白色系
const TITLE_COLOR = '#fff'
const SINGER_COLOR = 'rgba(255, 255, 255, 0.7)'
const ICON_COLOR = '#fff'

const Title = () => {
  const musicInfo = usePlayerMusicInfo()


  return (
    <View style={styles.titleContent}>
      <Text numberOfLines={1} style={styles.title} size={14} color={TITLE_COLOR}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.title} size={12} color={SINGER_COLOR}>{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View style={{ height: HEADER_HEIGHT }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <View style={styles.container}>
        <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }}>
          <PhIcon Icon={CaretLeft} size={18} color={ICON_COLOR} />
        </TouchableOpacity>
        <Title />
        <DesktopLyricBtn />
        <Btn icon={SlidersHorizontal} onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} position="left" direction="horizontal" />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flex: 0,
    // backgroundColor: '#ccc',
    flexDirection: 'row',
    // justifyContent: 'center',
    height: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
  titleContent: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    // flex: 1,
    // textAlign: 'center',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
