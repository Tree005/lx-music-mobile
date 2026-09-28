import { useEffect, useState } from 'react'

/**
 * 防抖值：value 连续变化时，只在停止变化 delay 毫秒后应用。
 * 用于过滤布局实测值的瞬时波动（如歌词折行/切歌过渡引起的容器高度跳变），
 * 避免依赖它的封面尺寸/位置反复变化；与「只增不减」不同，稳定值变小也会被应用（不会永久偏大）
 */
export default function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(value) }, delay)
    return () => { clearTimeout(timer) }
  }, [value, delay])
  return debounced
}
