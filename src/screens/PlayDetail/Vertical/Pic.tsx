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
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

// 封面宽度占屏宽比例（参考图实测 88.8%）
const WIDTH_RATIO = 0.88
// 封面圆角（参考图实测约 3dp，近直角）
const BORDER_RADIUS = scaleSizeW(3)
// 封面以下的固定内容高度预算（歌词两行 + 信息行 + 进度条/时间 + 控制行 + 底部工具栏 + 底部留白 ≈ 322dp），
// 只在屏高不足时用来收缩封面，避免整页被撑出屏幕；正常屏宽下封面以 88% 屏宽为准
const BELOW_COVER_HEIGHT = scaleSizeH(322)

export default ({ componentId, onPress }: { componentId: string, onPress: () => void }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

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
    const maxHeight = winHeight - statusBarHeight - HEADER_HEIGHT - BELOW_COVER_HEIGHT
    const imgWidth = Math.min(winWidth * WIDTH_RATIO, maxHeight)
    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: BORDER_RADIUS,
    }
  }, [statusBarHeight, winHeight, winWidth])

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
    // 与下方歌词的间距，让封面整体上移一点
    marginBottom: scaleSizeH(16),
  },
})
