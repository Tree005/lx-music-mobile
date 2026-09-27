import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Play, Pause, Playlist } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { useIsPlay, useProgress } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'
import PlayQueuePopup from '@/components/player/PlayQueuePopup'

// 播放键外套的圆形进度环尺寸
const RING_SIZE = scaleSizeW(34)
const RING_STROKE = 2.5
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

// 播放/暂停按钮：外套圆形进度环，进度取全局播放进度（0~1）
const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const { progress } = useProgress()
  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  const dashOffset = RING_CIRCUMFERENCE * (1 - clampedProgress)

  return (
    <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPress={togglePlay}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={theme['c-200']}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={theme['c-primary']}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.playIcon} pointerEvents="none">
        <PhIcon Icon={isPlay ? Pause : Play} weight="fill" color={theme['c-font']} size={15} />
      </View>
    </TouchableOpacity>
  )
}

export default () => {
  const theme = useTheme()
  const [queueVisible, setQueueVisible] = useState(false)

  return (
    <>
      <TogglePlayBtn />
      <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPress={() => { setQueueVisible(true) }}>
        <PhIcon Icon={Playlist} color={theme['c-font']} size={22} />
      </TouchableOpacity>
      <PlayQueuePopup visible={queueVisible} onClose={() => { setQueueVisible(false) }} />
    </>
  )
}


const styles = createStyle({
  controlBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
