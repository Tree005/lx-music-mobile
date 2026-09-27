import { useEffect, useState } from 'react'

import { getListDetail } from '@/core/songlist'
import { log } from '@/utils/log'

export interface SonglistOnlineInfo {
  /** 源歌单自己的封面（自建歌单没有） */
  img?: string
  /** 源歌单的描述 */
  desc?: string
}

// 按本地歌单 id 缓存：歌单列表与详情页各取一次也只发一次请求
const cache = new Map<string, SonglistOnlineInfo>()
const pendingTasks = new Map<string, Promise<SonglistOnlineInfo | undefined>>()

// 音源返回的空字符串会顶掉兜底图/兜底文案，统一转成 undefined
const normalize = (value?: string) => (value?.length ? value : undefined)

/**
 * 取收藏/导入的本地歌单在源平台的封面与描述。
 * 本地歌单只存了歌曲，封面和描述要用源的歌单 id 再取一次；自建歌单没有源，返回 undefined。
 */
export const getSonglistOnlineInfo = async(listInfo: LX.List.UserListInfo): Promise<SonglistOnlineInfo | undefined> => {
  const { source, sourceListId } = listInfo
  // 排行榜来的歌单 id 是 board__xxx，没有歌单详情可查
  if (!source || !sourceListId || sourceListId.startsWith('board__')) return undefined

  const cached = cache.get(listInfo.id)
  if (cached) return cached

  let task = pendingTasks.get(listInfo.id)
  if (!task) {
    task = getListDetail(sourceListId, source, 1).then(detail => {
      const info = { img: normalize(detail.info?.img), desc: normalize(detail.info?.desc) }
      cache.set(listInfo.id, info)
      pendingTasks.delete(listInfo.id)
      return info
    }).catch(() => {
      pendingTasks.delete(listInfo.id)
      log.warn(`get songlist info failed: ${source} ${sourceListId}`)
      return undefined
    })
    pendingTasks.set(listInfo.id, task)
  }
  return task
}

/** 收藏/导入的本地歌单的源歌单信息（拿不到时为 undefined） */
export const useSonglistOnlineInfo = (listInfo: LX.List.UserListInfo | undefined) => {
  const [info, setInfo] = useState<SonglistOnlineInfo | undefined>()

  useEffect(() => {
    setInfo(undefined)
    if (!listInfo) return
    let isUnmounted = false
    void getSonglistOnlineInfo(listInfo).then(info => {
      if (isUnmounted) return
      setInfo(info)
    })
    return () => {
      isUnmounted = true
    }
  // 只跟着本地歌单 id 走，避免对象引用变化导致重复请求
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listInfo?.id])

  return info
}
