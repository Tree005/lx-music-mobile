import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import Progress from '@/components/player/Progress'
import Status from './Status'
import { useProgress } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'

// const FONT_SIZE = 13

// 整页是暗色模糊底，时间文字用半透明白
const TIME_COLOR = 'rgba(255, 255, 255, 0.6)'
// 横屏的进度元素是一个与整行等高的胶囊（时间文字叠在它上面），
// 所以不能用纯白实心填充，否则会盖掉文字；用白色系的不同透明度表示进度层次
const PROGRESS_COLORS = {
  track: 'rgba(255, 255, 255, 0.15)',
  buffered: 'rgba(255, 255, 255, 0.25)',
  played: 'rgba(255, 255, 255, 0.4)',
  playedOnDrag: 'rgba(255, 255, 255, 0.4)',
  preview: 'rgba(255, 255, 255, 0.6)',
}

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  // console.log(timeStr)
  return <Text color={TIME_COLOR}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  return <Text color={TIME_COLOR}>{timeStr}</Text>
})

export default () => {
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  const buffered = useBufferProgress()
  // console.log('render playInfo')

  return (
    <View style={styles.container}>
      <View style={styles.status} >
        <Status />
      </View>
      <View style={{ flexGrow: 0, flexShrink: 0, flexDirection: 'row' }} >
        <PlayTimeCurrent timeStr={nowPlayTimeStr} />
        <Text color={TIME_COLOR}> / </Text>
        <PlayTimeMax timeStr={maxPlayTimeStr} />
      </View>
      <View style={[StyleSheet.absoluteFill, styles.progress]}><Progress progress={progress} duration={maxPlayTime} buffered={buffered} colors={PROGRESS_COLORS} /></View>
    </View>
  )
}


const styles = createStyle({
  container: {
    // marginLeft: 15,
    marginVertical: 5,
    height: 26,
    // flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    // backgroundColor: '#ccc',
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 5,
  },
})
// const styles = createStyle({
//   container: {
//     flex: 1,
//     // height: 16,
//     // flexGrow: 0,
//     // flexShrink: 0,
//     // flexDirection: 'column',
//     // justifyContent: 'center',
//     // alignItems: 'center',
//     // marginBottom: -1,
//     // backgroundColor: '#ccc',
//     // overflow: 'hidden',
//     // height:
//     // position: 'absolute',
//     // width: '100%',
//     // top: 0,
//     paddingVertical: 2,
//     paddingHorizontal: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   progress: {
//     paddingVertical: 2,
//     zIndex: 100,
//   },
//   status: {
//     flexGrow: 1,
//     flexShrink: 1,
//     paddingRight: 5,
//   },
// })
