import { memo } from 'react'
import { TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { setSpText } from '@/utils/pixelRatio'

// 整页是暗色模糊底，歌词用白色；下一行降透明度区分主次
const CURRENT_COLOR = '#fff'
const NEXT_COLOR = 'rgba(255, 255, 255, 0.45)'

// 封面下方嵌入的两行歌词：当前行（亮）+ 下一行（暗），点击进入全屏歌词页
export default memo(({ onPress }: { onPress: () => void }) => {
  const t = useI18n()
  const { line } = useLrcPlay()
  const lines = useLrcSet()

  // 有歌词时：播放前（line < 0）先显示第一句；确无歌词才显示占位文案
  const hasLrc = lines.length > 0
  const activeIndex = line >= 0 ? line : 0
  const currentText = hasLrc ? (lines[activeIndex]?.text || t('play_detail_no_lrc')) : t('play_detail_no_lrc')
  const nextText = hasLrc ? lines[activeIndex + 1]?.text ?? '' : ''

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.6} onPress={onPress}>
      <Text numberOfLines={1} size={15} color={CURRENT_COLOR} style={styles.currentLine}>{currentText}</Text>
      <Text numberOfLines={1} size={13} color={NEXT_COLOR} style={styles.nextLine}>{nextText || ' '}</Text>
    </TouchableOpacity>
  )
})

const styles = createStyle({
  container: {
    // 左对齐，左边缘与下方歌名/歌手一条竖线（参考汽水音乐：歌词/歌名同为 20dp 内边距）
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    // 与封面底边的间距（参考汽水：约封面高度的 0.068）
    paddingTop: 14,
    paddingBottom: 0,
  },
  currentLine: {
    lineHeight: setSpText(15) * 1.5,
  },
  nextLine: {
    // 两行之间留出行距（参考汽水：约封面高度的 0.091）
    marginTop: 6,
    lineHeight: setSpText(13) * 1.5,
  },
})
