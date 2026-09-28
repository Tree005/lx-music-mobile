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
    paddingHorizontal: scaleSizeW(8),
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: scaleSizeW(4),
  },
})
