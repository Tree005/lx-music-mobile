import { useEffect, useState } from 'react'

import { getMusicPicUrl } from '@/utils/musicPic'

/**
 * 歌曲封面地址：meta.picUrl 有就直接用，没有就去音源接口拿（内部有缓存）
 */
export const useMusicPic = (info: LX.Music.MusicInfo | undefined) => {
  const [url, setUrl] = useState(info?.meta.picUrl ?? '')

  useEffect(() => {
    if (!info) {
      setUrl('')
      return
    }
    if (info.meta.picUrl) {
      setUrl(info.meta.picUrl)
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
