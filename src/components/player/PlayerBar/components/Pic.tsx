import { Animated, TouchableOpacity } from 'react-native'
import { navigations } from '@/navigation'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback, useMemo } from 'react'
import { useSpinOnPlay } from '@/utils/hooks'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { createStyle } from '@/utils/tools'
import { PRESS_OPACITY } from '@/theme/motion'

// 黑胶唱片：黑色圆盘 + 中间的专辑图（仿网易云——黑色盘面在白色条上做视觉缓冲）。
// 盘面直径和胶囊条等高（42dp）并贴在条左端（条的 paddingLeft 为 0），
// 此时圆盘与条左端的圆角完全重合，不会露出白色月牙缝
const PIC_SIZE = scaleSizeH(42)
// 中间专辑图的直径（参考网易云，约占盘面 0.6）
const ART_SIZE = Math.round(PIC_SIZE * 0.62)

const styles = createStyle({
  touch: {
    borderRadius: PIC_SIZE / 2,
  },
  disc: {
    width: PIC_SIZE,
    height: PIC_SIZE,
    borderRadius: PIC_SIZE / 2,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: ART_SIZE / 2,
  },
})

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  // 播放时封面旋转（仿网易云黑胶，约 10 秒一圈），暂停停在当前角度
  const spin = useSpinOnPlay(isPlay)
  const spinStyle = useMemo(() => ({
    transform: [{
      rotate: spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    }],
  }), [spin])

  const handlePress = () => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity style={styles.touch} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={PRESS_OPACITY} >
      <Animated.View style={[styles.disc, spinStyle]}>
        <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={styles.art} onError={handleError} />
      </Animated.View>
    </TouchableOpacity>
  )
}
