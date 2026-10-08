import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Pause, Play, SkipBack, SkipForward } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
// import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
// import { scaleSizeW } from '@/utils/pixelRatio'
import { useIsPlay } from '@/store/player/hook'
import { useLayout } from '@/utils/hooks'
import { marginLeft } from '../constant'
import { BTN_WIDTH } from '../MoreBtn/Btn'
import { PRESS_OPACITY } from '@/theme/motion'

// const WIDTH = scaleSizeW(48)
// 整页是暗色模糊底，播放控制图标统一白色
const ICON_COLOR = '#fff'

const PrevBtn = ({ size }: { size: number }) => {
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: size, height: size }} activeOpacity={PRESS_OPACITY} onPress={handlePlayPrev}>
      <PhIcon Icon={SkipBack} color={ICON_COLOR} size={size * 0.7} weight="fill" />
    </TouchableOpacity>
  )
}
const NextBtn = ({ size }: { size: number }) => {
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: size, height: size }} activeOpacity={PRESS_OPACITY} onPress={handlePlayNext}>
      <PhIcon Icon={SkipForward} color={ICON_COLOR} size={size * 0.7} weight="fill" />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: size, height: size }} activeOpacity={PRESS_OPACITY} onPress={togglePlay}>
      <PhIcon Icon={isPlay ? Pause : Play} color={ICON_COLOR} size={size * 0.7} weight="fill" />
    </TouchableOpacity>
  )
}

const MIN_SIZE = BTN_WIDTH * 1.1
export default () => {
  const { onLayout, height, width } = useLayout()
  const size = Math.max(Math.min(height * 0.65, (width - marginLeft) * 0.52 * 0.3) * global.lx.fontSize, MIN_SIZE)
  return (
    <View style={{ ...styles.content, gap: size * 0.5 }} onLayout={onLayout}>
      <PrevBtn size={size} />
      <TogglePlayBtn size={size}/>
      <NextBtn size={size} />
    </View>
  )
}


const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    // paddingVertical: 8,
    gap: 22,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
    // marginLeft: 10,
  },
})
