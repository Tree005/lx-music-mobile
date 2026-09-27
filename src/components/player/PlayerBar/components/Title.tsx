import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { playNext, playPrev } from '@/core/player/player'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'

// 跑马灯滚动速度（px/秒，参考网易云实测约 100px/s）与循环接续的间隙
const MARQUEE_SPEED = 100
const MARQUEE_GAP = 60
// 竖直滑动切歌的触发阈值（位移 ≥ 30px，且竖直位移大于水平位移）
const SWIPE_TRIGGER = 30
const SWIPE_THRESHOLD = 12

export default ({ isHome }: { isHome: boolean }) => {
  // const { t } = useTranslation()
  const musicInfo = usePlayerMusicInfo()
  const downloadFileName = useSettingValue('download.fileName')
  const theme = useTheme()

  const handlePress = () => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
    // toast(global.i18n.t('play_detail_todo_tip'), 'long')
  }
  const handleLongPress = () => {
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }
  // console.log('render title')

  // 歌名与歌手拆开渲染以分别设样式；顺序/是否显示歌手跟随「下载文件名格式」设置
  const name = musicInfo.id ? musicInfo.name : ''
  const singer = musicInfo.singer ?? ''
  const singerFirst = downloadFileName == '歌手 - 歌名'
  const showSinger = !!singer && downloadFileName != '歌名'

  // 左右滑动切歌（对齐网易云）：左滑下一首、右滑上一首；移动超过阈值时接管，
  // 点击/长按（无位移）不受影响
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dx < -SWIPE_TRIGGER) void playNext()
      else if (g.dx > SWIPE_TRIGGER) void playPrev()
    },
  })).current

  // 歌名过长时的跑马灯：文本 + 间隙 + 文本，无缝向左循环
  const [containerWidth, setContainerWidth] = useState(0)
  const [textWidth, setTextWidth] = useState(0)
  const needScroll = containerWidth > 0 && textWidth > containerWidth
  const scrollX = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!needScroll) {
      scrollX.stopAnimation()
      scrollX.setValue(0)
      return
    }
    const total = textWidth + MARQUEE_GAP
    scrollX.setValue(0)
    const anim = Animated.loop(Animated.timing(scrollX, {
      toValue: -total,
      duration: (total / MARQUEE_SPEED) * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }))
    anim.start()
    return () => {
      anim.stop()
    }
  }, [needScroll, textWidth, scrollX])

  const line = useMemo(() => (
    <Text color={theme['c-font']} numberOfLines={1}>
      {showSinger && singerFirst ? <Text color={theme['c-font-label']}>{singer} - </Text> : null}
      <Text style={styles.name}>{name}</Text>
      {showSinger && !singerFirst ? <Text color={theme['c-font-label']}> - {singer}</Text> : null}
    </Text>
  ), [theme, name, singer, singerFirst, showSinger])

  const scrollStyle = useMemo(() => ({
    transform: [{ translateX: scrollX }],
  }), [scrollX])

  return (
    <View style={styles.outer} {...panResponder.panHandlers}>
      <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7}>
        <View
          style={styles.marquee}
          onLayout={({ nativeEvent }) => { setContainerWidth(nativeEvent.layout.width) }}
        >
          {needScroll
            ? (
              <Animated.View style={[styles.scrollRow, scrollStyle]}>
                <View>{line}</View>
                <View style={{ width: MARQUEE_GAP }} />
                <View>{line}</View>
              </Animated.View>
              )
            : line}
        </View>
        {/* 隐藏的测量副本：绝对定位不受容器宽度约束，拿到文本真实宽度 */}
        <View style={styles.measure} pointerEvents="none">
          <Text color="transparent" onTextLayout={({ nativeEvent }) => {
            const w = Math.ceil(nativeEvent.lines[0]?.width ?? 0)
            if (w > 0) setTextWidth(w)
          }}>{line}</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}
// const Singer = () => {
//   const playMusicInfo = useGetter('player', 'playMusicInfo')
//   return (
//     <View style={{ flexGrow: 0, flexShrink: 0 }}>
//       <Text style={{ width: '100%', color: AppColors.normal }} numberOfLines={1}>
//         {playMusicInfo ? playMusicInfo.musicInfo.singer : ''}
//       </Text>
//     </View>
//   )
// }
// const MusicName = () => {
//   const playMusicInfo = useGetter('player', 'playMusicInfo')
//   return (
//     <View style={{ flexGrow: 0, flexShrink: 1 }}>
//       <Text style={{ width: '100%', color: AppColors.normal }} numberOfLines={1}>
//         {playMusicInfo ? playMusicInfo.musicInfo.name : '^-^'}
//       </Text>
//     </View>
//   )
// }

const styles = createStyle({
  outer: {
    width: '100%',
  },
  container: {
    width: '100%',
    paddingHorizontal: 2,
    // paddingBottom: 4,
    // height: '50%',
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  marquee: {
    width: '100%',
    overflow: 'hidden',
  },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measure: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
  },
  // 歌名加粗，歌手用灰色（在外层 Text 上单独设置）
  name: {
    fontWeight: '600',
  },
})
