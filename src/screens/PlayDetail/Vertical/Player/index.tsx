import { memo } from 'react'
import { View } from 'react-native'

import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'


export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <PlayInfo />
      <ControlBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    paddingHorizontal: 15,
    // 控制行图标底边到屏幕底部的视觉留白约 30dp（扣掉按钮自身的空白）
    paddingBottom: 20,
    paddingTop: 0,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    flexDirection: 'column',
  },
})
