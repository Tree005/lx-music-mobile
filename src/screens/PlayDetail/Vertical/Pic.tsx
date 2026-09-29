import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { MusicNote } from 'phosphor-react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import StatusBar from '@/components/common/StatusBar'
import { PhIcon } from '@/components/common/PhIcon'
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

// 入场动画注册：只在传了 componentId（全屏播放页）时挂载该子组件；
// 复用组件（心动页）不传 componentId 时不注册（hook 不能条件调用，用空组件承载）
const EntryAppearListener = ({ componentId, onAppear }: { componentId: string, onAppear: () => void }) => {
  useNavigationComponentDidAppear(componentId, onAppear)
  return null
}

// 封面容器：只负责「位置/尺寸/点击/封面兜底占位」——
// 封面图本身由外层 SwipeSongContainer 的封面卡（常驻、自带 crossfade）显示，
// 单层显示避免「图片层 + 卡片层」双层协调带来的交接闪烁/残影。
// 兜底占位常驻在卡片下方：封面「没取到 / 等待中 / 图片在设备侧加载失败（外链 CDN 限制）」
// 时露出的都是这块暗色占位——有图时被卡片完全遮住，任何情况都不会出现空白框
export default ({ componentId, pagerHeight, belowCoverHeight, onPress, onCoverSize }: {
  /** 全屏播放页的 componentId；复用组件时不传（不注册入场动画） */
  componentId?: string
  /** 页面（PagerView）实测高度，0 = 还没量到 */
  pagerHeight: number
  /** 封面以下内容（歌词 + 歌曲信息）实测高度，0 = 还没量到 */
  belowCoverHeight: number
  onPress: () => void
  /** 上报实际渲染的封面边长（跟手滑动的预览封面按它对齐，减少切换跳变） */
  onCoverSize?: (size: number) => void
}) => {
  const { width: winWidth, height: winHeight } = useWindowSize()
  // 用设备固定值（store 里的状态栏高度会抖动，见 Header.tsx 的说明）
  const statusBarHeight = StatusBar.currentHeight

  // 没传 componentId（复用场景如心动页）：没有入场动画，直接跟随全局封面更新；
  // 传了 componentId 的全屏播放页则等页面出现后再同步（避免进场瞬间封面闪变）
  const [animated, setAnimated] = useState(componentId ? !!commonState.componentIds.playDetail : true)

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
        {/* nativeID 挂在容器上（共享元素转场对容器做动画，尺寸与封面一致） */}
        <View nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{ ...style, overflow: 'hidden' }}>
          <View style={[StyleSheet.absoluteFill, styles.emptyCover]}>
            <PhIcon Icon={MusicNote} size={style.width * 0.42} color="rgba(255, 255, 255, 0.22)" />
          </View>
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
  emptyCover: {
    alignItems: 'center',
    justifyContent: 'center',
    // 暗色播放页上的无封面占位：很淡的白蒙层，与暗底融合（不用主题色——浅色块在暗底上太扎眼）
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
})
