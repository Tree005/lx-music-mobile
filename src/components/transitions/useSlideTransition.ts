import { useCallback, useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { SLIDE_DURATION_STACK } from './constants'

/**
 * 横滑转场的公共驱动 hook：一个 0 → 1 的 progress 值 + 播放/结算两个动作。
 *
 * 约定（NavStack / Tab 切换 / 设置页共用）：
 * - 转场开始前调用 start()：progress 从 0 播放到 1（转场中随时可读它做位移插值）
 * - 转场被打断（还没播完就要切到下一个目标）时调用 settle()：立即结束在途动画并结算，
 *   不等剩余动画播完（保证新目标可以马上从当前稳定态重新出发）
 * - token 防串台：start 的完成回调只在「没有被新的 start/settle 取代」时触发，
 *   否则旧动画结束时会误触发上一轮的 onFinish
 * - 兜底定时器：native 动画完成回调实测有 200~500ms 延迟，期间转场层还在等 onFinish
 *   （pointerEvents 仍为 none、「刚进页点不动」），超时后按完成处理
 * - 每次转场结束后由使用方把 progress 复位（setValue(0)），配合角色映射让已结算态不依赖 progress 值
 */
export interface SlideTransitionHandle {
  /** 0 → 1 的转场进度 */
  progress: Animated.Value
  /** 从 0 播放到 1；被 settle / 新 start 取代时不会触发 onFinish */
  start: (onFinish: () => void) => void
  /** 立即结束在途动画并结算（打断场景） */
  settle: (onFinish: () => void) => void
}

export default (duration = SLIDE_DURATION_STACK): SlideTransitionHandle => {
  const progress = useRef(new Animated.Value(1)).current
  // 每次 start/settle 都自增；过期的动画回调直接丢弃
  const tokenRef = useRef(0)
  // 兜底定时器（动画完成回调延迟时按完成处理）
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearFinishTimer = useCallback(() => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    }
  }, [])

  const start = useCallback((onFinish: () => void) => {
    const token = (tokenRef.current += 1)
    clearFinishTimer()
    progress.setValue(0)
    // 幂等：完成回调与兜底定时器谁先到谁触发，同一 token 只结算一次
    let done = false
    const finishOnce = () => {
      if (done || token !== tokenRef.current) return
      done = true
      clearFinishTimer()
      onFinish()
    }
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      finishOnce()
    })
    // 超时兜底：动画在 native 侧早就播完，只是完成回调还压在 native→JS 队列里 ——
    // 转场画面已就位但内容层还 pointerEvents=none，超时后直接走与完成回调相同的结算
    finishTimerRef.current = setTimeout(finishOnce, duration + 80)
  }, [progress, duration, clearFinishTimer])

  const settle = useCallback((onFinish: () => void) => {
    tokenRef.current += 1
    clearFinishTimer()
    progress.stopAnimation()
    onFinish()
  }, [progress, clearFinishTimer])

  // 卸载时停掉在途动画并清掉兜底定时器
  useEffect(() => {
    return () => {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current)
        finishTimerRef.current = null
      }
      progress.stopAnimation()
    }
  }, [progress])

  return { progress, start, settle }
}
