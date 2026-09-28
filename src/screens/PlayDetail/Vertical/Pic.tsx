import { useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
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
const COVER_BOTTOM_MARGIN = scaleSizeH(16)

export default ({ componentId, pagerHeight, belowCoverHeight, onPress }: {
  componentId: string
  /** 页面（PagerView）实测高度，0 = 还没量到 */
  pagerHeight: number
  /** 封面以下内容（歌词 + 歌曲信息）实测高度，0 = 还没量到 */
  belowCoverHeight: number
  onPress: () => void
}) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  // 用设备固定值（store 里的状态栏高度会抖动，见 Header.tsx 的说明）
  const statusBarHeight = StatusBar.currentHeight

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })
  // console.log('render pic')

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

  return (
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={onPress}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style} />
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
