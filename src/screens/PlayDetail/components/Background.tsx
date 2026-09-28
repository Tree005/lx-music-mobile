import { memo, useEffect, useRef, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { usePlayerMusicInfo } from '@/store/player/hook'
import { defaultHeaders } from '@/components/common/Image'

// 黑色遮罩：让封面色调透出来，同时整页压暗，保证白色文字/图标可读
// （0.45：亮色封面（白底专辑图）下白字对比度也够，暗色封面仍保留色相）
const MASK_COLOR = 'rgba(0, 0, 0, 0.45)'
// 无封面时的深色纯底（与遮罩后的整体亮度接近）
const FALLBACK_COLOR = '#1a1a1a'
// 换封面时新图加载完成的淡入时长（ms）：放慢一些过渡更柔和，也给新封面的预取/加载留时间
const FADE_DURATION = 600

const toUri = (pic: string | null | undefined) => pic == null ? null : pic.startsWith('/') ? 'file://' + pic : pic

// 播放器整页暗色模糊底：当前封面模糊铺底 + 黑色遮罩，封面切换时背景跟着变
// 换封面时旧图垫底保持显示、新图加载完成后淡入（crossfade）——新图 URL 未取到或还在加载时，
// 背景一直是上一张封面，不会出现空白/闪白（对齐网易云的滑动切歌观感）
// 竖屏（Vertical）与横屏（Horizontal）共用；传入 pic 时用它做背景（心动页显示非当前播放歌的快照），不传时跟随全局当前播放歌
export default memo(({ pic: picOverride }: { pic?: string | null } = {}) => {
  const playerPic = usePlayerMusicInfo().pic
  const target = toUri(picOverride === undefined ? playerPic : picOverride)

  // top = 目标封面（加载完成后自动淡入）；bottom = 上一张垫底图（被 top 盖住，换图瞬间维持画面）
  const [top, setTop] = useState<string | null>(target)
  const [bottom, setBottom] = useState<string | null>(null)
  const topRef = useRef(target)

  useEffect(() => {
    if (target === topRef.current) return
    setBottom(topRef.current)
    topRef.current = target
    setTop(target)
  }, [target])

  const hasPic = (top ?? bottom) != null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {
        bottom != null && bottom !== top
          ? (
              <Image
                key={`bg_bottom_${bottom}`}
                style={StyleSheet.absoluteFill}
                source={{ uri: bottom, headers: defaultHeaders }}
                resizeMode="cover"
                blurRadius={25}
              />
            )
          : null
      }
      {
        top != null
          ? (
              <Image
                key={`bg_top_${top}`}
                style={StyleSheet.absoluteFill}
                source={{ uri: top, headers: defaultHeaders }}
                resizeMode="cover"
                blurRadius={25}
                fadeDuration={FADE_DURATION}
                // 加载完成（或失败）后垫底图就没有存在意义了，撤掉省一份模糊运算
                onLoadEnd={() => { setBottom(prev => prev === top ? null : prev) }}
              />
            )
          : null
      }
      <View style={[StyleSheet.absoluteFill, { backgroundColor: hasPic ? MASK_COLOR : FALLBACK_COLOR }]} />
    </View>
  )
})
