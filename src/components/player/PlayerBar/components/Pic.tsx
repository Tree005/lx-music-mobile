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

// 圆形封面，直径与胶囊条高度（index.tsx 的 BAR_HEIGHT）一致，贴在条内
const PIC_SIZE = scaleSizeH(42)

const styles = createStyle({
  touch: {
    borderRadius: PIC_SIZE / 2,
  },
  image: {
    width: PIC_SIZE,
    height: PIC_SIZE,
    borderRadius: PIC_SIZE / 2,
    // 1dp 半透明黑边，模拟唱片边缘
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
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
    <TouchableOpacity style={styles.touch} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      <Animated.View style={spinStyle}>
        <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={styles.image} onError={handleError} />
      </Animated.View>
    </TouchableOpacity>
  )
}
