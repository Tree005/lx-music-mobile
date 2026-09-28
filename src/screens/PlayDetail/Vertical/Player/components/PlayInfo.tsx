import { memo } from 'react'
import { View } from 'react-native'

import Progress from '@/components/player/ProgressBar'
import { useProgress } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'

// 整页是暗色模糊底，进度条与时间文字统一用白色系
const TIME_COLOR = 'rgba(255, 255, 255, 0.6)'
const PROGRESS_COLORS = {
  track: 'rgba(255, 255, 255, 0.25)',
  buffered: 'rgba(255, 255, 255, 0.35)',
  played: '#fff',
  playedOnDrag: '#fff',
  preview: '#fff',
  dot: '#fff',
}
// 圆点直径（设计稿宽度单位，参考图实测约 5dp）
const PROGRESS_DOT_SIZE = 8

// const FONT_SIZE = 13

/** 进度数据覆盖（心动页显示非当前播放歌时传入；不传时跟随全局播放进度） */
export interface PlayInfoOverride {
  nowPlayTime: number
  maxPlayTime: number
  nowPlayTimeStr: string
  maxPlayTimeStr: string
  /** 0~1 */
  progress: number
  /** 0~1，缺省跟随全局缓存进度 */
  buffered?: number
}

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  return <Text color={TIME_COLOR}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  return <Text color={TIME_COLOR}>{timeStr}</Text>
})

export default ({ override, disableSeek }: { override?: PlayInfoOverride, disableSeek?: boolean } = {}) => {
  const globalProgress = useProgress()
  const globalBuffered = useBufferProgress()
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = override ?? globalProgress
  const buffered = override?.buffered ?? globalBuffered

  // console.log('render playInfo')

  return (
    <>
      {/* disableSeek 时禁掉进度条子树的触摸（不传时 pointerEvents="auto" 与原来一致） */}
      <View style={styles.progress} pointerEvents={disableSeek ? 'none' : 'auto'}>
        <Progress progress={progress} duration={maxPlayTime} buffered={buffered} colors={PROGRESS_COLORS} dotSize={PROGRESS_DOT_SIZE} />
      </View>
      <View style={styles.info}>
        <PlayTimeCurrent timeStr={nowPlayTimeStr} />
        <PlayTimeMax timeStr={maxPlayTimeStr} />
      </View>
    </>
  )
}


const styles = createStyle({
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    // 信息行到进度条的视觉间距约 20dp（组件内部另有 9dp 触控留白）
    marginTop: 11,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    // backgroundColor: '#ccc',
  },
})
