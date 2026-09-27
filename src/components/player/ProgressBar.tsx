import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'
// 注意：Circle 在 phosphor-react-native 中只以 CircleIcon 导出
import { CircleIcon } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
// import { AppColors } from '@/theme'


const DefaultBar = memo(({ color }: { color: string }) => {
  return <View style={{ ...styles.progressBar, backgroundColor: color, position: 'absolute', width: '100%', left: 0, top: 0 }}></View>
})

const BufferedBar = memo(({ progress, color }: { progress: number, color: string }) => {
  // console.log(bufferedProgress)
  return <View style={{ ...styles.progressBar, backgroundColor: color, position: 'absolute', width: `${progress * 100}%`, left: 0, top: 0 }}></View>
})


const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)
  // const handlePress = useCallback((event: GestureResponderEvent) => {
  //   onPress(event.nativeEvent.locationX)
  // }, [onPress])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      // onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        // console.log(evt.nativeEvent.locationX, gestureState)
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      // onPanResponderTerminate: (evt, gestureState) => {
      //   onDragEnd()
      // },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})


/** 自定义进度条配色，不传则跟随主题色 */
export interface ProgressColors {
  /** 未播放轨道 */
  track: string
  /** 已缓存进度 */
  buffered: string
  /** 已播放进度 */
  played: string
  /** 拖动时的已播放进度（比 played 更实，避免被预览色盖住） */
  playedOnDrag: string
  /** 拖动时的进度预览 */
  preview: string
  /** 圆点 */
  dot: string
}

const Progress = ({ progress, duration, buffered, colors, dotSize = progressDotSize }: {
  progress: number
  duration: number
  buffered: number
  colors?: ProgressColors
  /** 圆点直径（同旧版尺寸单位，内部按屏宽缩放），默认同旧版 */
  dotSize?: number
}) => {
  // const { progress: bufferProgress } = usePlayTimeBuffer()
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  // console.log(progress)
  const progressStr: `${number}%` = `${progress * 100}%`

  // 不传自定义配色时保持旧版的主题色行为
  const barColors = colors ?? {
    track: theme['c-primary-light-300-alpha-800'],
    buffered: theme['c-primary-light-400-alpha-700'],
    played: theme['c-primary-light-100-alpha-400'],
    playedOnDrag: theme['c-primary-light-100-alpha-700'],
    preview: theme['c-primary-light-100-alpha-600'],
    dot: theme['c-primary-light-100'],
  }

  const progressDotStyle = useMemo(() => {
    return {
      width: dotSize,
      position: 'absolute',
      right: -dotSize / 2,
      top: -(dotSize - progressHeightSize) / 2,
    } as const
  }, [dotSize])

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, [])

  return (
    <View style={styles.progress}>
      <View>
        <DefaultBar color={barColors.track} />
        <BufferedBar progress={buffered} color={barColors.buffered} />
        {
          draging
            ? (
                <>
                  <View style={{ ...styles.progressBar, backgroundColor: barColors.playedOnDrag, width: progressStr, position: 'absolute', left: 0, top: 0 }} />
                  <View style={{ ...styles.progressBar, backgroundColor: barColors.preview, width: `${dragProgress * 100}%`, position: 'absolute', left: 0, top: 0 }}>
                    {/* PhIcon 不支持 style，用 View 承载原本的绝对定位 */}
                    <View style={progressDotStyle}>
                      <PhIcon Icon={CircleIcon} color={barColors.dot} size={dotSize} weight="fill" />
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ ...styles.progressBar, backgroundColor: barColors.played, width: progressStr, position: 'absolute', left: 0, top: 0 }}>
                  {/* PhIcon 不支持 style，用 View 承载原本的绝对定位 */}
                  <View style={progressDotStyle}>
                    <PhIcon Icon={CircleIcon} color={barColors.dot} size={dotSize} weight="fill" />
                  </View>
                </View>
              )
        }

      </View>
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
      {/* <View style={{ ...styles.progressBar, height: '100%', width: progressStr }}><Pressable style={styles.progressDot}></Pressable></View> */}
    </View>
  )
}


const progressContentPadding = 10
const progressHeight = 3.6
const progressContentHeight = progressContentPadding * 2 + progressHeight
const progressHeightSize = scaleSizeH(progressHeight)
let progressDotSize = scaleSizeW(progressContentHeight * 0.8)
const styles = createStyle({
  progress: {
    width: '100%',
    height: progressContentHeight,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    zIndex: 1,
  },
  progressBar: {
    height: progressHeight,
    borderRadius: 4,
  },
  pressBar: {
    position: 'absolute',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    left: 0,
    top: 0,
    height: progressContentHeight,
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    width: '100%',
    zIndex: 6,
  },
})

export default Progress
