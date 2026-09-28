import { memo } from 'react'
import { View } from 'react-native'

import PlayInfo, { type PlayInfoOverride } from './components/PlayInfo'
import ControlBtn, { type ControlBtnOverrides } from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

/** 数据/行为覆盖（心动页复用时传入；不传 = 完全跟随全局播放状态） */
export interface PlayerOverrides extends ControlBtnOverrides {
  /** 进度数据覆盖（显示非当前播放歌的进度） */
  progress?: PlayInfoOverride
  /** 进度条不可拖动/点击 */
  disableSeek?: boolean
}

export default memo(({ overrides }: { overrides?: PlayerOverrides } = {}) => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <PlayInfo override={overrides?.progress} disableSeek={overrides?.disableSeek} />
      <ControlBtn overrides={overrides} />
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
