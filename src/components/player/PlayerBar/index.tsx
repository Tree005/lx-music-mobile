import { memo, useMemo } from 'react'
import { View } from 'react-native'
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
// 播放条的上下外边距（底部多留一点：用户要求条整体往上抬一点）
const BAR_MARGIN_TOP = scaleSizeH(3)
const BAR_MARGIN_BOTTOM = scaleSizeH(8)
// 播放条悬浮在内容上时，列表底部要预留的高度（条高 + 上下外边距）
export const PLAYER_BAR_SPACE = BAR_HEIGHT + BAR_MARGIN_TOP + BAR_MARGIN_BOTTOM

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
    marginTop: BAR_MARGIN_TOP,
    marginBottom: BAR_MARGIN_BOTTOM,
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
    // 歌名与封面/按钮之间留一点间距（用户反馈贴太近）；
    // 滚动时两端由 Title 里的渐隐遮罩做过渡，所以这里不会露出硬裁切边
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(4),
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: scaleSizeW(4),
  },
})
