import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import StatusBar from '@/components/common/StatusBar'
import commonState from '@/store/common/state'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

// 封面宽度占屏宽比例（参考图实测 88.8%）
const WIDTH_RATIO = 0.88
// 封面圆角（参考图实测约 3dp，近直角）
const BORDER_RADIUS = scaleSizeW(3)
// 封面以下的固定内容高度预算（歌词两行 + 信息行 + 进度条/时间 + 控制行 + 底部工具栏 + 底部留白 ≈ 322dp），
// 只在实测高度还没拿到时兜底；正常都用页面实测值算，避免整页被撑出屏幕
const BELOW_COVER_HEIGHT = scaleSizeH(322)
// 封面与下方歌词的间距（content 的 marginBottom，计算可用高度时要一并扣掉）
export const COVER_BOTTOM_MARGIN = scaleSizeH(16)
// 切歌时新封面加载完成的淡入时长（ms），配合垫底层旧封面，避免加载期间露出浅色占位（闪白）
const FADE_DURATION = 300

// 入场动画注册：只在传了 componentId（全屏播放页）时挂载该子组件；
// 复用组件（心动页）不传 componentId 时不注册（hook 不能条件调用，用空组件承载）
const EntryAppearListener = ({ componentId, onAppear }: { componentId: string, onAppear: () => void }) => {
  useNavigationComponentDidAppear(componentId, onAppear)
  return null
}

export default ({ componentId, picOverride, pagerHeight, belowCoverHeight, onPress, onCoverSize }: {
  /** 全屏播放页的 componentId；复用组件时不传（不注册入场动画） */
  componentId?: string
  /** 覆盖显示的封面图（含 null = 无封面）；不传时跟随全局当前播放歌 */
  picOverride?: string | null
  /** 页面（PagerView）实测高度，0 = 还没量到 */
  pagerHeight: number
  /** 封面以下内容（歌词 + 歌曲信息）实测高度，0 = 还没量到 */
  belowCoverHeight: number
  onPress: () => void
  /** 上报实际渲染的封面边长（跟手滑动的预览封面按它对齐，减少切换跳变） */
  onCoverSize?: (size: number) => void
}) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  // 用设备固定值（store 里的状态栏高度会抖动，见 Header.tsx 的说明）
  const statusBarHeight = StatusBar.currentHeight

  // 没传 componentId（复用场景如心动页）：没有入场动画，直接跟随全局封面更新；
  // 传了 componentId 的全屏播放页则等页面出现后再同步（避免进场瞬间封面闪变）
  const [animated, setAnimated] = useState(componentId ? !!commonState.componentIds.playDetail : true)
  const [pic, setPic] = useState(picOverride === undefined ? musicInfo.pic : picOverride)
  useEffect(() => {
    // 传了 picOverride 时封面直接用外部值（含 null），不做全局封面同步
    if (picOverride !== undefined) {
      setPic(picOverride)
      return
    }
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated, picOverride])
  // console.log('render pic')

  // crossfade：换封面时旧封面垫底保持显示，新封面加载完成后淡入（FADE_DURATION）；
  // 新歌封面 URL 还没取到时也保持旧封面，只有一开始就没有封面时才露出音符占位——避免大块浅色占位在深色页面上闪白
  const [top, setTop] = useState<string | null>(pic ?? null)
  const [bottom, setBottom] = useState<string | null>(null)
  const topRef = useRef<string | null>(pic ?? null)
  useEffect(() => {
    const next = pic ?? null
    if (next === topRef.current) return
    setBottom(topRef.current)
    topRef.current = next
    setTop(next)
  }, [pic])

  const style = useMemo(() => {
    // 优先用实测：页面高度 - 封面以下内容高度 - 封面下边距 = 封面可用的最大高度。
    // 这样无论歌词加载前后、进页面瞬间窗口数据准不准，封面都会自动收缩到放得下
    const maxHeight = pagerHeight > 0 && belowCoverHeight > 0
      ? pagerHeight - belowCoverHeight - COVER_BOTTOM_MARGIN
      : winHeight - statusBarHeight - HEADER_HEIGHT - BELOW_COVER_HEIGHT
    const imgWidth = Math.min(winWidth * WIDTH_RATIO, Math.max(maxHeight, 0))
    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: BORDER_RADIUS,
    }
  }, [statusBarHeight, winHeight, winWidth, pagerHeight, belowCoverHeight])

  // 上报封面尺寸（跟手滑动的预览封面按它对齐）
  useEffect(() => {
    if (style.width > 0) onCoverSize?.(style.width)
  }, [style.width, onCoverSize])

  return (
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={onPress}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        {/* nativeID 挂在容器上（共享元素转场对容器做动画，尺寸与封面一致）；overflow hidden 裁出圆角 */}
        <View nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{ ...style, overflow: 'hidden' }}>
          {/* 最底层：音符占位兜底（没有任何封面时显示，也垫住新图加载的空档） */}
          <Image url={null} style={StyleSheet.absoluteFill} />
          {/* 垫底层：上一张封面，被新封面盖住，换歌瞬间维持画面 */}
          {bottom != null && bottom !== top ? <Image url={bottom} style={StyleSheet.absoluteFill} /> : null}
          {/* 新封面：加载完成后自动淡入 */}
          {top != null ? <Image url={top} style={StyleSheet.absoluteFill} fadeDuration={FADE_DURATION} /> : null}
        </View>
      </View>
      {componentId ? <EntryAppearListener componentId={componentId} onAppear={() => { setAnimated(true) }} /> : null}
    </TouchableOpacity>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    // 贴底对齐：多出来的空间留给封面上方，保证封面下方的间距严格按参考图收紧
    justifyContent: 'flex-end',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    // elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: BORDER_RADIUS,
    // 与下方歌词的间距，让封面整体上移一点（计算封面可用高度时也要扣掉）
    marginBottom: COVER_BOTTOM_MARGIN,
  },
})
