import { memo, useMemo } from 'react'
import { View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

// 胶囊条高度（圆角取高度的一半）
const BAR_HEIGHT = scaleSizeH(42)
// 播放条悬浮在内容上时，列表底部要预留的高度（条高 + 上下外边距）
export const PLAYER_BAR_SPACE = BAR_HEIGHT + scaleSizeH(6)
// 歌名裁剪区两端的渐隐宽度（文字进出时淡出/淡入，而不是被硬裁一刀）
const TITLE_FADE_WIDTH = scaleSizeW(10)

// 歌名裁剪区两端的渐隐遮罩：从滑块背景色渐到透明
const TitleFade = memo(({ side }: { side: 'left' | 'right' }) => {
  const theme = useTheme()
  const bg = theme['c-content-background']
  return (
    <View style={[styles.titleFade, side == 'left' ? styles.titleFadeLeft : styles.titleFadeRight]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={`titleFade_${side}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={bg} stopOpacity={side == 'left' ? '1' : '0'} />
            <Stop offset="1" stopColor={bg} stopOpacity={side == 'left' ? '0' : '1'} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#titleFade_${side})`} />
      </Svg>
    </View>
  )
})

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')

  const playerComponent = useMemo(() => (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <Pic isHome={isHome} />
      <View style={styles.center}>
        <Title isHome={isHome} />
        {/* 两端渐隐：文字从封面边缘淡入、到播放按钮边缘淡出 */}
        <TitleFade side="left" />
        <TitleFade side="right" />
      </View>
      <View style={styles.right}>
        <ControlBtn />
      </View>
    </View>
  ), [theme, isHome])

  // 没有歌曲时不显示播放条（用「当前播放的歌曲」判断，切歌瞬间 musicInfo.id 会被临时清空）
  if (!playMusicInfo.musicInfo) return null
  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  container: {
    height: BAR_HEIGHT,
    marginHorizontal: scaleSizeW(10),
    marginVertical: scaleSizeH(3),
    // 封面（比条略大）贴左端，把条的圆角端盖住、不留白缝
    paddingLeft: 0,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    // 很浅的阴影：页面是纯白底，给「条」一点可辨识度（比原来重阴影轻很多）
    elevation: 3,
  },
  center: {
    flexGrow: 1,
    flexShrink: 1,
    height: '100%',
    justifyContent: 'center',
    // 不加左右内边距：歌名的裁剪区紧贴封面和右侧按钮，
    // 滚动时文字从封面边缘滑出、到按钮边上消失（不会露出一段矩形的裁切边）
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: scaleSizeW(4),
  },
  titleFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: TITLE_FADE_WIDTH,
  },
  titleFadeLeft: {
    left: 0,
  },
  titleFadeRight: {
    right: 0,
  },
})
