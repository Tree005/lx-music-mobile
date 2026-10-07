import { useEffect, useMemo } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { HEADER_HEIGHT } from './components/Header'
import StatusBar from '@/components/common/StatusBar'
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

// 封面容器：只负责「位置/尺寸/点击/缩放跟随」——
// 封面图本身由外层 SwipeSongContainer 的封面卡（常驻、自带 crossfade）显示，
// 单层显示避免「图片层 + 卡片层」双层协调带来的交接闪烁/残影
export default ({ pagerHeight, belowCoverHeight, onPress, onCoverSize, coverScale }: {
  /** 页面（PagerView）实测高度，0 = 还没量到 */
  pagerHeight: number
  /** 封面以下内容（歌词 + 歌曲信息）实测高度，0 = 还没量到 */
  belowCoverHeight: number
  onPress: () => void
  /** 上报实际渲染的封面边长（跟手滑动的预览封面按它对齐，减少切换跳变） */
  onCoverSize?: (size: number) => void
  /** 封面缩放动画值（暂停/拖动收缩）：与封面卡共用同一个值，保证同步、同心 */
  coverScale?: Animated.Value
}) => {
  const { width: winWidth, height: winHeight } = useWindowSize()
  // 用设备固定值（store 里的状态栏高度会抖动，见 Header.tsx 的说明）
  const statusBarHeight = StatusBar.currentHeight

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
      {/* 无 elevation：阴影的轮廓是原尺寸的圆角矩形，封面缩小时会在缩小封面后方
          露出一个「原尺寸的深色框」（用户反馈的"透明框"）；去掉后缩小时四周只剩背景 */}
      <View style={styles.content}>
        {/* nativeID 挂在容器上（共享元素转场对容器做动画，尺寸与封面一致）；
            缩放与封面卡共用同一个动画值（暂停/拖动时同步收缩，两者同心对齐）。
            兜底占位已移除（用户要求无色不可见）：封面未就绪/失败/无封面时透出底层
            模糊背景（Background 自身带深色兜底），不再出现淡色方块 */}
        <Animated.View
          nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
          style={[{ ...style, overflow: 'hidden' }, coverScale ? { transform: [{ scale: coverScale }] } : null]}
        />
      </View>
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
