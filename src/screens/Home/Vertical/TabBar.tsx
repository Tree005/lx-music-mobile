import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BOTTOM_TABS, TAB_OF_ID } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useNavigationBarHeight } from '@/utils/hooks'
import { PRESS_OPACITY } from '@/theme/motion'

// 底栏内容区高度（不含系统导航栏安全区）
const TAB_BAR_HEIGHT = scaleSizeH(44)
// 心动态底栏底色的淡出/淡入时长（透明度过渡，0 = 透明、1 = 主题底色）
const TAB_BAR_FADE_DURATION = 300

const styles = createStyle({
  container: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

// 底部 Tab 只显示文字（不显示图标）
const TabItem = ({ id, onPress, heartbeat }: {
  id: (typeof BOTTOM_TABS)[number]['id']
  onPress: (id: (typeof BOTTOM_TABS)[number]['id']) => void
  /** 心动页透明态（由 TabBar 统一决定，含离开时延迟释放） */
  heartbeat: boolean
}) => {
  const t = useI18n()
  const theme = useTheme()
  const activeId = useNavActiveId()
  // 用 TAB_OF_ID 映射，子页面时高亮其归属的父 Tab
  const active = TAB_OF_ID[activeId] === id
  // 心动页是暗色封面背景，Tab 跟着用白色系融入页面
  const color = heartbeat
    ? (active ? '#fff' : 'rgba(255, 255, 255, 0.6)')
    : (active ? theme['c-primary'] : theme['c-font-label'])

  return (
    <TouchableOpacity style={styles.item} activeOpacity={PRESS_OPACITY} onPress={() => { onPress(id) }}>
      <Text size={15} color={color}>{t(id)}</Text>
    </TouchableOpacity>
  )
}

export default memo(({ heartbeat }: { heartbeat?: boolean }) => {
  const theme = useTheme()
  const navigationBarHeight = useNavigationBarHeight()
  const activeId = useNavActiveId()
  // 心动页：底栏透明，露出页面延伸过来的封面模糊背景。
  // 父组件传 heartbeat 时以它为准（离开心动页时延迟释放透明态，避免转场中白闪）
  const isHeartbeat = heartbeat ?? (activeId == 'nav_ai')
  // 底色层的淡出/淡入（1 = 主题态、0 = 心动透明态）：进入心动渐隐、离开渐显。
  // 用透明度插值而不是背景色插值 —— 颜色插值从主题色到 transparent（透明黑）中间
  // 会经过半透明灰、把底栏压暗一截；透明度渐变更干净，而且能走 native driver。
  // 文字/图标颜色仍是瞬变（保持现状）
  const bgAnim = useRef(new Animated.Value(isHeartbeat ? 0 : 1)).current
  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isHeartbeat ? 0 : 1,
      duration: TAB_BAR_FADE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [isHeartbeat, bgAnim])

  const handlePress = (id: (typeof BOTTOM_TABS)[number]['id']) => {
    setNavActiveId(id)
  }

  return (
    // 沉浸式：高度加上系统导航栏高度，背景色延伸到屏幕最底部
    <View
      style={{
        ...styles.container,
        height: TAB_BAR_HEIGHT + navigationBarHeight,
        paddingBottom: navigationBarHeight,
      }}
    >
      {/* 底色层（含顶部分割线）：心动页淡出为透明，露出页面延伸过来的封面背景 */}
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme['c-content-background'],
          borderTopWidth: 1,
          borderTopColor: theme['c-border-background'],
          opacity: bgAnim,
        }}
      />
      {BOTTOM_TABS.map(item => <TabItem key={item.id} id={item.id} onPress={handlePress} heartbeat={isHeartbeat} />)}
    </View>
  )
})
