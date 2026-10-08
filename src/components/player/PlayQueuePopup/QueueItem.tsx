import { memo, useRef } from 'react'
import { Animated, PanResponder, TouchableOpacity, View } from 'react-native'
import { ListDashes, X } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { PRESS_OPACITY } from '@/theme/motion'

/** 队列行高，拖拽时按它换算目标下标 */
export const ITEM_HEIGHT = scaleSizeH(52)

const styles = createStyle({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(15),
    height: '100%',
    overflow: 'hidden',
  },
  name: {
    flexShrink: 1,
  },
  singer: {
    flexShrink: 1,
  },
  action: {
    width: scaleSizeW(40),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: scaleSizeW(44),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export interface QueueItemProps {
  item: LX.Music.MusicInfo
  index: number
  /** 是否为当前正在播放的歌 */
  active: boolean
  /** 正在被拖拽的行下标，-1 表示没有拖拽 */
  dragIndex: number
  /** 拖拽预计落点的行下标 */
  targetIndex: number
  /** 被拖拽行跟随手指的位移 */
  dragAnim: Animated.Value
  onPress: (index: number) => void
  onRemove: (index: number) => void
  onDragStart: (index: number) => void
  onDragMove: (dy: number) => void
  onDragEnd: () => void
}

export default memo(({
  item,
  index,
  active,
  dragIndex,
  targetIndex,
  dragAnim,
  onPress,
  onRemove,
  onDragStart,
  onDragMove,
  onDragEnd,
}: QueueItemProps) => {
  const theme = useTheme()
  const isDragging = index == dragIndex

  // PanResponder 只创建一次，回调与下标经 ref 转发，避免闭包读到过期值
  const latest = useRef({ index, onDragStart, onDragMove, onDragEnd })
  latest.current = { index, onDragStart, onDragMove, onDragEnd }

  const panResponder = useRef(PanResponder.create({
    // 按住手柄即进入拖拽；轻点不动时松手（位移为 0）不会产生任何改变
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    // 拖拽期间不让列表滚动抢走手势
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { latest.current.onDragStart(latest.current.index) },
    onPanResponderMove: (evt, gestureState) => { latest.current.onDragMove(gestureState.dy) },
    onPanResponderRelease: () => { latest.current.onDragEnd() },
    onPanResponderTerminate: () => { latest.current.onDragEnd() },
  })).current

  // 其余行给被拖拽行「让位」：往上或往下挪一格，留出落点
  let shift = 0
  if (dragIndex >= 0 && targetIndex >= 0 && dragIndex != targetIndex) {
    if (dragIndex < targetIndex && index > dragIndex && index <= targetIndex) shift = -1
    else if (dragIndex > targetIndex && index >= targetIndex && index < dragIndex) shift = 1
  }
  const translateY: number | Animated.Value = isDragging ? dragAnim : shift * ITEM_HEIGHT

  return (
    <Animated.View style={[
      styles.item,
      isDragging
        ? { backgroundColor: theme['c-050'], zIndex: 10, elevation: 4 }
        : active ? { backgroundColor: theme['c-050'] } : null,
      { transform: [{ translateY }] },
    ]}>
      <TouchableOpacity style={styles.main} activeOpacity={PRESS_OPACITY} onPress={() => { onPress(index) }}>
        <Text size={15} numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text size={12} color={theme['c-font-label']} numberOfLines={1} style={styles.singer}> · {item.singer}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.action} activeOpacity={PRESS_OPACITY} onPress={() => { onRemove(index) }}>
        <PhIcon Icon={X} size={16} color={theme['c-font-label']} />
      </TouchableOpacity>
      <View style={styles.handle} {...panResponder.panHandlers}>
        <PhIcon Icon={ListDashes} size={20} color={theme['c-250']} />
      </View>
    </Animated.View>
  )
})
