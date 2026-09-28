import { useEffect, useState } from 'react'
import { getAiRadioView, subscribeAiRadio, type AiRadioView } from './index'

/** 订阅心动会话状态（挂起快照 / 挂起态歌词 / 空态标记 / 开会话中） */
export const useAiRadioSession = (): AiRadioView => {
  const [view, setView] = useState(getAiRadioView)
  useEffect(() => subscribeAiRadio(() => {
    setView(getAiRadioView())
  }), [])
  return view
}
