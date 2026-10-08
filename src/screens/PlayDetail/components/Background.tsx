import { memo, useCallback, useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import CrossfadeImage from './CrossfadeImage'
import { getMusicPreviewPic, subscribeMusicPreviewPic } from '@/core/player/musicPreviewPic'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { getBackgroundImage } from '@/utils/nativeModules/utils'
import { DURATION } from '@/theme/motion'

// 背景位图由原生预渲染（getBackgroundImage：封面解码到 1/32 → 双线性放大成平滑色雾 → 亮度压缩 →
// 抖动噪声烘焙进位图 → WebP 缓存）：
// - 封面的文字/图案/构图细节在源头消失（无字影、无「能看到形状」）
// - 8bit 色阶环在生成时被抖动打散（无色阶环，因此也不需要运行时噪点图层）
// - JS 侧只显示一张成品位图（无运行时模糊开销）
// base 底色仅在生成期间兜底。bgCache：url → 成品文件路径（跨渲染保留，回到听过的歌秒出）

const bgCache = new Map<string, string>()

export default memo(({ pic: picOverride }: { pic?: string | null } = {}) => {
  const playerPic = usePlayerMusicInfo().pic
  // 滑动切歌的预览封面（滑动方向确定时由 SwipeSongContainer 上报）：预览封面的背景提前生成
  const [previewPic, setPreviewPic] = useState(getMusicPreviewPic())
  useEffect(() => subscribeMusicPreviewPic(() => { setPreviewPic(getMusicPreviewPic()) }), [])
  const target = previewPic ?? (picOverride === undefined ? playerPic : picOverride)

  const [bgFile, setBgFile] = useState<string | null>(() => (target ? bgCache.get(target) ?? null : null))
  useEffect(() => {
    if (!target) { setBgFile(null); return }
    const cached = bgCache.get(target)
    if (cached) { setBgFile(cached); return }
    let alive = true
    void getBackgroundImage(target).then((file) => {
      bgCache.set(target, file)
      if (alive) setBgFile(file)
    }).catch(() => { /* 生成失败保持 base 底色 */ })
    return () => { alive = false }
  }, [target])

  const handleError = useCallback(() => { setBgFile(null) }, [])

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a' }]} pointerEvents="none">
      {bgFile
        ? (
            <CrossfadeImage
              uri={`file://${bgFile}`}
              style={StyleSheet.absoluteFill}
              duration={DURATION.base}
              allowFastSkip={false}
              onError={handleError}
            />
          )
        : null}
    </View>
  )
})
