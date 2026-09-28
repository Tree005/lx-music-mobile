import { memo } from 'react'

import { StatusBar as RNStatusBar, View } from 'react-native'

import { CaretLeft } from 'phosphor-react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import Btn from './Btn'
import { createStyle } from '@/utils/tools'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

// 整页是暗色模糊底，顶栏图标用白色；状态栏也要切成浅色图标（否则浅色主题下看不见）
const ICON_COLOR = '#fff'


export default memo(() => {
  // 固定用设备状态栏高度（不要读 store 里的 useStatusbarHeight：那个值会在 0 与状态栏高度之间抖动，
  // 导致本页 Header 高度反复变化、整页布局跟着抖，ViewPager 的页面内容又不会跟着重排 → 信息行错位）
  const statusBarHeight = StatusBar.currentHeight

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar />
      {/* 覆盖全局主题的状态栏样式：本页背景恒为暗色，需要浅色图标（卸载后自动还原） */}
      <RNStatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Btn icon={CaretLeft} color={ICON_COLOR} onPress={back} />
      </View>
    </View>
  )
})


const styles = createStyle({
  container: {
    flexDirection: 'row',
    // justifyContent: 'center',
    height: '100%',
  },
})
