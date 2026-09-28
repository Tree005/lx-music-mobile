import { memo, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { usePlayerMusicInfo } from '@/store/player/hook'
import CrossfadeImage from './CrossfadeImage'

// 黑色遮罩：让封面色调透出来，同时整页压暗，保证白色文字/图标可读
// （0.45：亮色封面（白底专辑图）下白字对比度也够，暗色封面仍保留色相）
const MASK_COLOR = 'rgba(0, 0, 0, 0.45)'
// 无封面时的深色纯底（与遮罩后的整体亮度接近）
const FALLBACK_COLOR = '#1a1a1a'
// 换封面时新图加载完成的淡入时长（ms）：放慢一些过渡更柔和，也给新封面的预取/加载留时间
const FADE_DURATION = 600

const toUri = (pic: string | null | undefined) => pic == null ? null : pic.startsWith('/') ? 'file://' + pic : pic

// 播放器整页暗色模糊底：当前封面模糊铺底 + 黑色遮罩，封面切换时背景跟着变
// crossfade 由 CrossfadeImage 负责：显示中的旧图保持挂载不重载、新图淡入盖上，任何时刻不露白
// （对齐网易云的滑动切歌观感；新图 URL 未取到时背景保持上一张）
// 竖屏（Vertical）与横屏（Horizontal）共用；传入 pic 时用它做背景（心动页显示非当前播放歌的快照），不传时跟随全局当前播放歌
export default memo(({ pic: picOverride }: { pic?: string | null } = {}) => {
  const playerPic = usePlayerMusicInfo().pic
  const target = toUri(picOverride === undefined ? playerPic : picOverride)

  // 遮罩色：明确无封面（''）或从未有过图时用深色纯底，其余用遮罩色
  // （等待中 CrossfadeImage 会保持上一张图，遮罩跟着它）
  const [hasPicEver, setHasPicEver] = useState(!!target)
  useEffect(() => {
    if (target) setHasPicEver(true)
  }, [target])
  const showMask = target !== '' && hasPicEver

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <CrossfadeImage uri={target} style={StyleSheet.absoluteFill} blurRadius={25} duration={FADE_DURATION} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: showMask ? MASK_COLOR : FALLBACK_COLOR }]} />
    </View>
  )
})
