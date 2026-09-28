import { useEffect } from 'react'
import { LIST_IDS } from '@/config/constant'
import { usePlayInfo } from '@/store/player/hook'
import { useNavActiveId } from '@/store/common/hook'
import { useAiRadioSession } from '@/core/aiRadio/hook'
import { enterAiRadioPage, ensureSuspendedLyric } from '@/core/aiRadio'
import ActivePlayer from './ActivePlayer'
import SuspendedPlayer from './SuspendedPlayer'
import EmptyState from './EmptyState'

// 心动页：算法随机推歌的播放器页面（详细行为见需求确认稿与 @/core/aiRadio 的设计说明）
// - 活跃态：心动流正在播（全局上下文 = 心动列表）→ 直接绑全局播放状态渲染；
// - 挂起态：上下文被普通播放切走 → 渲染「快照歌」（暂停态），点播放 / 滑动可接着听；
// - 空态：会话还没开始（或推歌池为空）→ 提示 + 开始按钮。
export default () => {
  const playInfo = usePlayInfo()
  const isActive = playInfo.playerListId == LIST_IDS.AI_RADIO
  const aiSession = useAiRadioSession()
  const navActiveId = useNavActiveId()

  // 进（回到）心动页时触达核心：不抢正在响的音乐；没在响就续快照或开新会话
  useEffect(() => {
    if (navActiveId != 'nav_ai') return
    enterAiRadioPage()
  }, [navActiveId])

  // 挂起态：按需加载快照歌的歌词（独立解析，不与全局歌词单例混用）
  useEffect(() => {
    if (isActive || !aiSession.snapshot) return
    ensureSuspendedLyric()
  }, [isActive, aiSession.snapshot])

  if (isActive) return <ActivePlayer />
  if (aiSession.snapshot) return <SuspendedPlayer snapshot={aiSession.snapshot} lyricLines={aiSession.lyricLines} />
  return <EmptyState starting={aiSession.starting} poolEmpty={aiSession.poolEmpty} />
}
