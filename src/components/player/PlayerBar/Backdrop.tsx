import { View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { PLAYER_BAR_SPACE } from './index'

// 内容在播放条上方开始渐隐的高度
const FADE_HEIGHT = scaleSizeH(26)

/**
 * 悬浮播放条背后的渐变遮罩：内容靠近底部时渐隐到页面背景色（模仿网易云）。
 * 不透明部分正好覆盖播放条区域，所以条本身看不出「白底」的边界。
 */
export default () => {
  const theme = useTheme()
  const bg = theme['c-content-background']
  const height = PLAYER_BAR_SPACE + FADE_HEIGHT
  const fadeEnd = FADE_HEIGHT / height

  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="playerBarFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bg} stopOpacity="0" />
            <Stop offset={`${fadeEnd}`} stopColor={bg} stopOpacity="1" />
            <Stop offset="1" stopColor={bg} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#playerBarFade)" />
      </Svg>
    </View>
  )
}

const styles = {
  container: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
  },
}
