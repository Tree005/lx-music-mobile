import { memo } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { usePlayerMusicInfo } from '@/store/player/hook'
import { defaultHeaders } from '@/components/common/Image'

// 黑色遮罩：让封面色调透出来，同时整页压暗，保证白色文字/图标可读
// （0.45：亮色封面（白底专辑图）下白字对比度也够，暗色封面仍保留色相）
const MASK_COLOR = 'rgba(0, 0, 0, 0.45)'
// 无封面时的深色纯底（与遮罩后的整体亮度接近）
const FALLBACK_COLOR = '#1a1a1a'

// 播放器整页暗色模糊底：当前封面模糊铺底 + 黑色遮罩，封面切换时背景跟着变
// 竖屏（Vertical）与横屏（Horizontal）共用，两端的文字/图标都按这个暗底配白色系
// 传入 pic 时用它做背景（心动页显示非当前播放歌的快照）；不传时跟随全局当前播放歌
export default memo(({ pic: picOverride }: { pic?: string | null } = {}) => {
  const playerPic = usePlayerMusicInfo().pic
  const pic = picOverride === undefined ? playerPic : picOverride
  const uri = pic == null ? null : pic.startsWith('/') ? 'file://' + pic : pic

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {
        uri
          ? (
              <Image
                style={StyleSheet.absoluteFill}
                source={{ uri, headers: defaultHeaders }}
                resizeMode="cover"
                blurRadius={25}
              />
            )
          : null
      }
      <View style={[StyleSheet.absoluteFill, { backgroundColor: uri ? MASK_COLOR : FALLBACK_COLOR }]} />
    </View>
  )
})
