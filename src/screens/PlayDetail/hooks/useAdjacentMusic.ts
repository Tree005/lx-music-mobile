import { useCallback, useEffect, useState } from 'react'
import { getNextPlayMusicInfo } from '@/core/player/player'
import { toPreviewMusicInfo } from '@/screens/PlayDetail/components/SwipeSongContainer'
import { getListMusicSync } from '@/utils/listManage'
import { usePlayInfo, usePlayerMusicInfo } from '@/store/player/hook'
import playerState from '@/store/player/state'

/**
 * 播放页的「相邻歌」预览数据（跟手滑动时滑进来的歌要与实际会播放的一致）：
 * - 下一首：走播放核心的 getNextPlayMusicInfo —— 随机播放时这次调用会把结果提前定下来，
 *   之后 playNext / 心动流切换播放的就是同一首；已有结果时返回同一个，重复调用安全
 * - 上一首：与 playPrev 一致 —— 优先「播放历史」的上一首（随机播放下走这里），
 *   没有历史才回落到列表顺序的上一首
 */
export const useAdjacentMusic = () => {
  const musicInfo = usePlayerMusicInfo()
  const playInfo = usePlayInfo()
  const [playedListVersion, setPlayedListVersion] = useState(0)

  // 播放历史变化时重算上一首（随机模式下每次切歌都会更新历史）
  useEffect(() => {
    const handle = () => { setPlayedListVersion(v => v + 1) }
    global.state_event.on('playPlayedListChanged', handle)
    return () => {
      global.state_event.off('playPlayedListChanged', handle)
    }
  }, [])

  const fetchNext = useCallback(async(): Promise<LX.Music.MusicInfo | null> => {
    const info = await getNextPlayMusicInfo(true)
    return toPreviewMusicInfo(info?.musicInfo)
  }, [])

  const fetchPrev = useCallback((): LX.Music.MusicInfo | null => {
    const list = getListMusicSync(playInfo.playerListId)
    const index = playInfo.playerPlayIndex
    const playedList = playerState.playedList
    const currentPlayedIndex = playedList.findIndex(m => m.musicInfo.id === musicInfo.id)
    const prev = currentPlayedIndex > 0
      ? playedList[currentPlayedIndex - 1].musicInfo
      : (index > 0 ? list[index - 1] : null)
    return prev ? toPreviewMusicInfo(prev) : null
  // playedListVersion 参与依赖：播放历史变化时返回新的回调，让外部重新取上一首
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicInfo.id, playInfo.playerListId, playInfo.playerPlayIndex, playedListVersion])

  return { fetchNext, fetchPrev }
}
