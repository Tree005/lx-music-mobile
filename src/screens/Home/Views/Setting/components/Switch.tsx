import { memo, useCallback, useEffect, useRef } from 'react'

import { Animated, Easing, Pressable } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

interface Props {
  value: boolean
  onValueChange?: (v: boolean) => void
  disabled?: boolean
  size?: number
}

// 尺寸基准（DIP，实际尺寸全部乘以 size）
const TRACK_WIDTH = 46
const TRACK_HEIGHT = 28
const THUMB_SIZE = 24
const PADDING = 2
// 圆钮最大位移：轨道宽 - 圆钮 - 两侧内边距
const THUMB_MAX_OFFSET = TRACK_WIDTH - THUMB_SIZE - PADDING * 2

// 自绘滑动开关（iOS / 网易云风格）：浅灰轨道 + 主题色覆盖层 + 白色圆钮
export default memo(({ value, onValueChange, disabled = false, size = 1 }: Props) => {
  const theme = useTheme()
  // 0 = 关闭，1 = 开启；驱动覆盖层透明度与圆钮位移
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [value, progress])

  const handlePress = useCallback(() => {
    onValueChange?.(!value)
  }, [onValueChange, value])

  const borderRadius = TRACK_HEIGHT / 2 * size

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      style={{
        width: TRACK_WIDTH * size,
        height: TRACK_HEIGHT * size,
        borderRadius,
        // 关闭时浅灰底；禁用再浅一档
        backgroundColor: disabled ? theme['c-300'] : theme['c-400'],
      }}
    >
      {/* 开启色覆盖层：透明度由 progress 驱动，开启时显出主题色 */}
      <Animated.View
        style={[styles.fill, {
          borderRadius,
          backgroundColor: theme['c-primary'],
          opacity: progress,
        }]}
      />
      {/* 白色圆钮：left 固定在内边距处（垂直居中），translateX 由 progress 插值到最大位移 */}
      <Animated.View
        style={[styles.thumb, {
          width: THUMB_SIZE * size,
          height: THUMB_SIZE * size,
          borderRadius: THUMB_SIZE / 2 * size,
          left: PADDING * size,
          top: (TRACK_HEIGHT - THUMB_SIZE) / 2 * size,
          transform: [{
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, THUMB_MAX_OFFSET * size],
            }),
          }],
        }]}
      />
    </Pressable>
  )
})

const styles = createStyle({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
})
