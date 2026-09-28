import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo, usePlayInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { getNextPlayMusicInfo, playNext, playPrev } from '@/core/player/player'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { getListMusicSync } from '@/utils/listManage'
import { createStyle } from '@/utils/tools'

// 跑马灯滚动速度（px/秒，参考网易云实测约 100px/s）与循环接续的间隙
const MARQUEE_SPEED = 100
const MARQUEE_GAP = 60
// 左右滑动切歌（对齐网易云）：水平位移超过 SWIPE_THRESHOLD 时接管手势，
// 松手时容器位置超过 SWIPE_TRIGGER 即切歌、否则回弹原位
const SWIPE_THRESHOLD = 8
const SWIPE_TRIGGER = 30
// 松手后的补齐/回弹动画时长
const SETTLE_DURATION = 180
// 提交切歌后的兜底：歌曲信息迟迟不落地（如单曲列表重播同一首）也要把位移复位
const COMMIT_TIMEOUT = 1200

// 歌名容器要显示的信息（跟手切换时的上一首/下一首统一成「歌名 + 歌手」）
interface MusicLabel {
  name: string
  singer: string
}
const toMusicLabel = (music: LX.Music.MusicInfo | LX.Download.ListItem | null | undefined): MusicLabel | null => {
  if (!music) return null
  if ('metadata' in music) return { name: music.metadata.musicInfo.name, singer: music.metadata.musicInfo.singer }
  return { name: music.name, singer: music.singer ?? '' }
}

// 单格歌名（歌名 + 歌手）：过长时无缝向左循环滚动
const TitleCell = memo(({ width, name, singer, fileNameMode, textColor, labelColor }: {
  width: number
  name: string
  singer: string
  /** 「下载文件名格式」设置：决定歌名/歌手顺序与是否显示歌手 */
  fileNameMode: string
  textColor: string
  labelColor: string
}) => {
  const [textWidth, setTextWidth] = useState(0)
  const needScroll = width > 0 && textWidth > width
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

  const singerFirst = fileNameMode == '歌手 - 歌名'
  const showSinger = !!singer && fileNameMode != '歌名'
  const line = useMemo(() => (
    <Text color={textColor} numberOfLines={1}>
      {showSinger && singerFirst ? <Text color={labelColor}>{singer} - </Text> : null}
      <Text style={styles.name}>{name}</Text>
      {showSinger && !singerFirst ? <Text color={labelColor}> - {singer}</Text> : null}
    </Text>
  ), [textColor, labelColor, name, singer, singerFirst, showSinger])

  const scrollStyle = useMemo(() => ({
    transform: [{ translateX: scrollX }],
  }), [scrollX])

  return (
    <View style={[styles.cell, { width }]}>
      <View style={styles.marquee}>
        {needScroll
          ? (
            <Animated.View style={[styles.scrollRow, scrollStyle]}>
              <View style={{ width: textWidth }}>{line}</View>
              <View style={{ width: MARQUEE_GAP }} />
              <View style={{ width: textWidth }}>{line}</View>
            </Animated.View>
            )
          : line}
      </View>
      {/* 隐藏的测量副本：必须给一个明确的大宽度——绝对定位子节点会被 Yoga 约束成容器宽度，
          不给宽度量到的就是被截断后的宽度（textWidth 永远不大于可视宽度），跑马灯不会触发 */}
      <View style={styles.measure} pointerEvents="none">
        <Text color="transparent" onTextLayout={({ nativeEvent }) => {
          const w = Math.ceil(nativeEvent.lines[0]?.width ?? 0)
          if (w > 0) setTextWidth(w)
        }}>{line}</Text>
      </View>
    </View>
  )
})

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const playInfo = usePlayInfo()
  const downloadFileName = useSettingValue('download.fileName')
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
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

  const name = musicInfo.id ? musicInfo.name : ''
  const singer = musicInfo.singer ?? ''

  // 相邻歌曲：跟手切换时把它们的歌名容器一起滑进来。
  // 必须与「实际会播放的歌」一致——随机播放时列表顺序的下一首并不是真正的下一首，
  // 所以下一首直接用播放器的 getNextPlayMusicInfo 算（随机结果会被它提前定下来，
  // 之后 playNext 播放的就是同一首，保证滑进来的歌名与实际播放一致）
  const [nextMusic, setNextMusic] = useState<MusicLabel | null>(null)
  const [, setPlayedListVersion] = useState(0)
  const nextMusicReqRef = useRef(0)

  // 取真正的下一首：随机播放时这次调用会把随机结果提前定下来，之后 playNext 播放的就是同一首；
  // 已有结果时播放器直接返回同一个，所以重复调用安全（只认最后一次请求的结果）
  const refreshNextMusic = useCallback(() => {
    const req = ++nextMusicReqRef.current
    void getNextPlayMusicInfo(true).then(info => {
      if (req !== nextMusicReqRef.current) return
      setNextMusic(toMusicLabel(info?.musicInfo))
    })
  }, [])

  useEffect(() => {
    refreshNextMusic()
  }, [musicInfo.id, togglePlayMethod, playInfo.playerListId, refreshNextMusic])

  // 播放历史变化时重算上一首（随机模式下每次切歌都会更新历史）
  useEffect(() => {
    const handle = () => { setPlayedListVersion(v => v + 1) }
    global.state_event.on('playPlayedListChanged', handle)
    return () => {
      global.state_event.off('playPlayedListChanged', handle)
    }
  }, [])

  // 上一首：与播放器 playPrev 一致——优先「播放历史」里的上一首（随机播放走这里），
  // 没有历史时才回落到列表顺序的上一首
  const list = getListMusicSync(playInfo.playerListId)
  const index = playInfo.playerPlayIndex
  const playedList = playerState.playedList
  const currentPlayedIndex = playedList.findIndex(m => m.musicInfo.id === musicInfo.id)
  const prevMusic = currentPlayedIndex > 0
    ? toMusicLabel(playedList[currentPlayedIndex - 1].musicInfo)
    : toMusicLabel(index > 0 ? list[index - 1] : null)

  // 可视区宽度 = 单格歌名容器宽度（三格横排：上一首 / 当前 / 下一首，中间格居中）
  const [width, setWidth] = useState(0)
  const dragX = useRef(new Animated.Value(0)).current
  const startXRef = useRef(0)
  const committedRef = useRef(false)
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 手势回调只创建一次，宽度/相邻歌曲通过 ref 取最新值
  const stateRef = useRef({ width: 0, canNext: false, canPrev: false })
  stateRef.current.width = width
  stateRef.current.canNext = !!nextMusic
  stateRef.current.canPrev = !!prevMusic

  const panResponder = useMemo(() => {
    const clamp = (x: number, w: number) => Math.max(-w, Math.min(w, x))
    const settle = (to: number, then?: () => void) => {
      Animated.timing(dragX, {
        toValue: to,
        duration: SETTLE_DURATION,
        easing: Easing.out(Easing.quad),
        // 手势期间由 JS 侧 setValue 驱动，这里同样用 JS 驱动，避免混用警告
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) then?.()
      })
    }
    // 容器滑到位后真正切歌；等歌曲信息落地（musicInfo.id 变化）再把位移复位——
    // 此时中间格已经是新歌，复位在视觉上等于「停在原位」
    const commit = (direction: 1 | -1) => {
      if (committedRef.current) return
      committedRef.current = true
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
      commitTimerRef.current = setTimeout(() => {
        commitTimerRef.current = null
        if (!committedRef.current) return
        committedRef.current = false
        dragX.setValue(0)
      }, COMMIT_TIMEOUT)
      void (direction == 1 ? playNext() : playPrev())
    }
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy),
      // 从当前实际位置接管（连续快速滑动时不会跳变）
      onPanResponderGrant: () => {
        // 手势开始时再取一次下一首：开播时算的结果可能已被播放器的「重置随机结果」清掉，
        // 在真正切换之前重新定下来，保证滑进来的歌名与实际播放一致
        refreshNextMusic()
        dragX.stopAnimation((value) => { startXRef.current = value })
      },
      onPanResponderMove: (_, g) => {
        const w = stateRef.current.width
        if (!w) return
        let dx = g.dx
        // 该方向没有相邻歌曲时加阻尼：仍然可以滑动切歌，只是没有「滑进来的歌名容器」
        if ((dx < 0 && !stateRef.current.canNext) || (dx > 0 && !stateRef.current.canPrev)) dx *= 0.3
        dragX.setValue(clamp(startXRef.current + dx, w))
      },
      onPanResponderRelease: (_, g) => {
        const w = stateRef.current.width
        if (!w) return
        const finalX = clamp(startXRef.current + g.dx, w)
        if (finalX <= -SWIPE_TRIGGER) settle(-w, () => { commit(1) })
        else if (finalX >= SWIPE_TRIGGER) settle(w, () => { commit(-1) })
        else settle(0)
      },
      onPanResponderTerminate: () => { settle(0) },
    })
  }, [dragX, refreshNextMusic])

  useLayoutEffect(() => {
    if (!committedRef.current) return
    committedRef.current = false
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current)
      commitTimerRef.current = null
    }
    dragX.stopAnimation()
    dragX.setValue(0)
  }, [musicInfo.id, dragX])

  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
  }, [])

  const cellProps = { fileNameMode: downloadFileName, textColor: theme['c-font'], labelColor: theme['c-font-label'] }

  return (
    <View style={styles.outer} {...panResponder.panHandlers}>
      <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7}>
        <View
          style={styles.viewport}
          onLayout={({ nativeEvent }) => { setWidth(nativeEvent.layout.width) }}
        >
          {/* 轨道向左推一格，让中间格（当前歌曲）落在可视区 */}
          <Animated.View style={[styles.track, { marginLeft: -width, transform: [{ translateX: dragX }] }]}>
            <TitleCell {...cellProps} width={width} name={prevMusic?.name ?? ''} singer={prevMusic?.singer ?? ''} />
            <TitleCell {...cellProps} width={width} name={name} singer={singer} />
            <TitleCell {...cellProps} width={width} name={nextMusic?.name ?? ''} singer={nextMusic?.singer ?? ''} />
          </Animated.View>
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
  // 可视区：只露出中间一格，其余裁掉
  viewport: {
    width: '100%',
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flexShrink: 0,
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
    // 明确的大宽度：绕开「绝对定位子节点被约束为容器宽度」的测量陷阱
    width: 9999,
    opacity: 0,
  },
  // 歌名加粗，歌手用灰色（在外层 Text 上单独设置）
  name: {
    fontWeight: '600',
  },
})
