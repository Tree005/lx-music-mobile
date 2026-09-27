import { useCallback, useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

// 唱片旋转动画：isPlay 时持续旋转（无缝循环），暂停停在当前角度、恢复从当前角度继续。
// 返回 0~1 的 Animated.Value，用 interpolate 转成 0~360deg 使用
export default (isPlay: boolean, duration = 10000) => {
  const spin = useRef(new Animated.Value(0)).current
  const spinning = useRef(false)

  const startSpin = useCallback(() => {
    spinning.current = true
    const run = () => {
      if (!spinning.current) return
      spin.stopAnimation((current) => {
        if (!spinning.current) return
        const remain = Math.max(1 - (current % 1), 0.001)
        Animated.timing(spin, {
          toValue: 1,
          duration: duration * remain,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished || !spinning.current) return
          spin.setValue(0)
          run()
        })
      })
    }
    run()
  }, [spin, duration])

  const stopSpin = useCallback(() => {
    spinning.current = false
    spin.stopAnimation()
  }, [spin])

  useEffect(() => {
    if (isPlay) startSpin()
    else stopSpin()
    return stopSpin
  }, [isPlay, startSpin, stopSpin])

  return spin
}
