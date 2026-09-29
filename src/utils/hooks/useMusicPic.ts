import { useEffect, useState } from 'react'

import { getCachedMusicPicUrl, getMusicPicUrl } from '@/utils/musicPic'

/**
 * 歌曲封面地址：meta.picUrl 有就直接用；没有先同步查缓存（预取命中立即返回），
 * 再不然去音源接口拿（内部有缓存）。
 * 返回语义：string = 可用地址；null = 还在取（等待中）；'' = 明确取不到（无封面）
 */
export const useMusicPic = (info: LX.Music.MusicInfo | undefined): string | null => {
  const [url, setUrl] = useState<string | null>(() => {
    if (!info) return null
    return info.meta.picUrl ?? getCachedMusicPicUrl(info) ?? null
  })

  useEffect(() => {
    if (!info) {
      setUrl(null)
      return
    }
    if (info.meta.picUrl) {
      setUrl(info.meta.picUrl)
      return
    }
    // 预取过的封面（musicPic 缓存命中）同步可用：滑动预览/挂起态不用再等异步回填
    const cached = getCachedMusicPicUrl(info)
    if (cached != null) {
      setUrl(cached)
      return
    }
    let isUnmounted = false
    void getMusicPicUrl(info).then(picUrl => {
      if (isUnmounted) return
      setUrl(picUrl)
    })
    return () => {
      isUnmounted = true
    }
  // 只跟着歌曲 id 走，避免同一个 id 因为对象引用变化而重复请求
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.id])

  return url
}
