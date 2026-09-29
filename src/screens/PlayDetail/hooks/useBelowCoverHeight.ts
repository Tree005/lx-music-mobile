import { useRef } from 'react'

import { useDebouncedValue } from '@/utils/hooks'

/**
 * 「封面以下内容（歌词两行 + 信息行）」的实测高度。三个关键点（都是实测出来的坑）：
 * - **0 是假值**：标签页用 display:none 隐藏时，这块区域的实测高度会坍缩成 0，
 *   必须忽略（沿用上一个有效值）——否则切走再切回时，封面卡会先落到最底部
 *   （盖住歌词/信息区）、再等防抖跳回来，观感非常突兀；
 * - **首次值 / 从折叠恢复后的值立即应用**（不等防抖）：防抖的 300ms 窗口里
 *   封面会先停在错误位置再跳到实测位置（冷启动进页面时同样会发生）；
 * - 其余波动（歌词折行、切歌过渡等）仍走防抖，避免封面尺寸/位置反复变化。
 */
export const useBelowCoverHeight = (raw: number): number => {
  const debounced = useDebouncedValue(raw, 300)
  const lastValidRef = useRef(0)
  const prevRawRef = useRef(raw)
  const prevRaw = prevRawRef.current
  prevRawRef.current = raw
  if (raw > 0) lastValidRef.current = raw
  let result: number
  // 隐藏/折叠时的坍缩虚测（0）：忽略，沿用上一个有效高度
  if (raw === 0) result = lastValidRef.current
  // 首次实测 / 从折叠恢复：立即应用
  else if (prevRaw === 0) result = raw
  // 稳定期的波动走防抖；防抖还没跟上时先用实时值兜住（避免回到 0）
  else result = debounced > 0 ? debounced : raw
  return result
}
