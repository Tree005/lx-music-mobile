import { memo, useCallback, useEffect, useState } from 'react'
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native'

import { getMusicPreviewPic, subscribeMusicPreviewPic } from '@/core/player/musicPreviewPic'
import { usePlayerMusicInfo } from '@/store/player/hook'
import CrossfadeImage from './CrossfadeImage'

// 黑色遮罩：让封面色调透出来，同时整页压暗，保证白色文字/图标可读
// （0.68：把封面文字（书法大字/白底黑字标签等）在放大模糊后的"字影"、以及大块暗部
//  模糊出的"暗斑轮廓"压到不可辨——0.60 时背景里这些大形状的边缘仍隐约可见、
//  像有下层页面透出来；暗色封面仍保留色相）
const MASK_COLOR = 'rgba(0, 0, 0, 0.68)'
// 抖动噪声：模糊背景是大面积平滑暗色渐变，8bit 显色下渐变上会出现「色阶环」
// （相邻 1 级灰阶的锐利分界，跟随暗斑轮廓 → 观感像有轮廓/透明透出）；
// 叠一层极低强度的逐像素噪声把色阶边界打散成随机颗粒
const DITHER_IMAGE = require('@/resources/images/bgDither.png')
// 噪声块尺寸（DIP，与噪声图 128px 像素尺寸一致）
const DITHER_TILE_SIZE = 128
// 无封面时的深色纯底（与遮罩后的整体亮度接近）
const FALLBACK_COLOR = '#1a1a1a'
// 换封面时新图加载完成的淡入时长（ms）：全屏模糊背景是大面积+高对比的变化（如白封面对深色封面），
// 过渡必须放得很慢（呼吸式渐变）——且滑动切歌时渐变的起点会提前到「手势方向确定」的瞬间
// （见下面的预览封面通道），2s 的时长让变化几乎摊满整个滑动过程，高对比切换的"闪一下"基本被抹平
const FADE_DURATION = 2000

const toUri = (pic: string | null | undefined) => pic == null ? null : pic.startsWith('/') ? 'file://' + pic : pic

// 抖动噪声层：注意不能用 resizeMode="repeat" 平铺——Android 端实测无效，
// 只会画出左上角一张图（RN 0.73 + Fresco），所以按窗口尺寸铺网格、多张重叠同一张图（共享解码）
const DitherNoise = memo(() => {
  const { width, height } = useWindowDimensions()
  const cols = Math.ceil(width / DITHER_TILE_SIZE)
  const rows = Math.ceil(height / DITHER_TILE_SIZE)
  const tiles = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push(
        <Image
          key={`${row}-${col}`}
          source={DITHER_IMAGE}
          style={{ position: 'absolute', left: col * DITHER_TILE_SIZE, top: row * DITHER_TILE_SIZE, width: DITHER_TILE_SIZE, height: DITHER_TILE_SIZE }}
        />,
      )
    }
  }
  // overflow hidden：窗口尺寸比实际父容器大时裁掉越界瓦片
  return <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">{tiles}</View>
})

// 播放器整页暗色模糊底：当前封面模糊铺底 + 黑色遮罩，封面切换时背景跟着变
// crossfade 由 CrossfadeImage 负责：显示中的旧图保持挂载不重载、新图淡入盖上，任何时刻不露白
// （对齐网易云的滑动切歌观感；新图 URL 未取到时背景保持上一张）
// 竖屏（Vertical）与横屏（Horizontal）共用；传入 pic 时用它做背景（心动页显示非当前播放歌的快照），不传时跟随全局当前播放歌
export default memo(({ pic: picOverride }: { pic?: string | null } = {}) => {
  const playerPic = usePlayerMusicInfo().pic
  // 滑动切歌的预览封面（滑动方向确定时由 SwipeSongContainer 上报，含按钮触发的滑动）：
  // 优先于真实封面——背景在切歌落地前就开始朝邻歌渐变；回弹/切歌完成后上报方清空、自动回落
  const [previewPic, setPreviewPic] = useState(getMusicPreviewPic())
  useEffect(() => subscribeMusicPreviewPic(() => { setPreviewPic(getMusicPreviewPic()) }), [])
  const target = toUri(previewPic ?? (picOverride === undefined ? playerPic : picOverride))

  // 背景图加载失败（外链 CDN 在设备侧偶发拒绝）：退回深色纯底，
  // 不然「白底色页面 + 半透明黑遮罩」会渲染成一片灰面，观感像背景坏了
  const [failedUri, setFailedUri] = useState<string | null>(null)
  useEffect(() => { setFailedUri(null) }, [target])
  const handleLayerError = useCallback((uri: string) => { setFailedUri(uri) }, [])

  // 遮罩色：明确无封面（''）/加载失败或从未有过图时用深色纯底，其余用遮罩色
  // （等待中 CrossfadeImage 会保持上一张图，遮罩跟着它）
  const [hasPicEver, setHasPicEver] = useState(!!target)
  useEffect(() => {
    if (target) setHasPicEver(true)
  }, [target])
  const showMask = target !== '' && hasPicEver && failedUri !== target

  return (
    // 垫一层不透明深底：大 blurRadius 的模糊图在真机上可能有未覆盖/半透明的区域，
    // 从这些区域会隐隐透出下层页面（首页卡片等）的形状与颜色（用户反馈的「背景有一点点透」）；
    // 垫底后透出的是深色底、与背景观感一致；模糊图完好时被完全盖住、无视觉影响
    <View style={[StyleSheet.absoluteFill, { backgroundColor: FALLBACK_COLOR }]} pointerEvents="none">
      {/* blurRadius=70：背景是封面图放大 2.167 倍铺满，模糊值偏小时封面的文字/图案轮廓
          在放大后仍可辨认（尤其对照清晰封面，一眼能"认出"背景里的字）、观感像有东西浮在背景上；
          加大到 70 把这些大形状彻底糊成均匀色雾。
          allowFastSkip={false}：背景是全屏大图 + 模糊（绘制期运算，比解码慢很多），
          缓存命中也不能直接显示（模糊没画完会露底再突变）——保留淡入平滑过渡 */}
      <CrossfadeImage uri={target} style={StyleSheet.absoluteFill} blurRadius={70} duration={FADE_DURATION} allowFastSkip={false} onError={handleLayerError} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: showMask ? MASK_COLOR : FALLBACK_COLOR }]} />
      {/* 抖动噪声压在最上层：打散暗部渐变的 8bit 色阶环（含兜底纯底场景） */}
      <DitherNoise />
    </View>
  )
})
