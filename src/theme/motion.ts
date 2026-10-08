import { Easing } from 'react-native'

/**
 * 全局动效 / 交互 token（2026-10-08 与用户约定，见 CODEBUDDY.md「已知问题与约定」）：
 * 新代码一律从这里取值，不要再写 duration: xxx / Easing.xxx / activeOpacity={0.x} 魔法数；
 * 旧代码改到哪个文件顺手迁移，不做专项批量替换。
 */

/** 时长（ms）：fast=按压/微反馈，base=常规控件（开关、弹层内动画），enter=内容进场（弹层/卡片），slow=氛围类（背景渐变等） */
export const DURATION = {
  fast: 150,
  base: 200,
  enter: 300,
  slow: 700,
} as const

/** 缓动：standard=默认进出（先快后慢）；decelerate=轻减速；linear=循环/进度类 */
export const EASING = {
  standard: Easing.out(Easing.cubic),
  decelerate: Easing.out(Easing.quad),
  linear: Easing.linear,
} as const

/** spring 预设（Animated.spring 的 config，配 useNativeDriver）：sheet=底部弹层滑入；control=小控件（开关圆钮等） */
export const SPRING = {
  sheet: { friction: 26, tension: 300 },
  control: { friction: 22, tension: 260 },
} as const

/** 按压态不透明度（TouchableOpacity activeOpacity 统一值；替代 0.5/0.6/0.7/0.3 混用） */
export const PRESS_OPACITY = 0.7

/** 底部弹层滑入的初始位移（px）：slide 动画起点距最终位置的距离 */
export const SHEET_SLIDE_OFFSET = 300
