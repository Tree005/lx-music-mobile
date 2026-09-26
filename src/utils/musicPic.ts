import musicSdk from '@/utils/musicSdk'
import { log } from '@/utils/log'

interface MusicSdk {
  getPic?: (info: LX.Music.MusicInfo) => Promise<string>
}

// 封面地址缓存（含「拿不到」的空结果，避免重复请求）
const cache = new Map<string, string>()
// 同一个 songmid 在并发时只发一次请求
const pendingTasks = new Map<string, Promise<string>>()

/**
 * 取歌曲封面地址：
 * 在线歌曲的 meta.picUrl 一般是空的，只有播放过或取过详情才有，
 * 这里按音源接口去拿一次，结果按歌曲 id 缓存
 */
export const getMusicPicUrl = async(info: LX.Music.MusicInfo): Promise<string> => {
  if (info.meta.picUrl) return info.meta.picUrl
  const cached = cache.get(info.id)
  if (cached != null) return cached
  let task = pendingTasks.get(info.id)
  if (!task) {
    task = (async() => {
      let url = ''
      try {
        const sdk = (musicSdk as unknown as Record<string, MusicSdk | undefined>)[info.source]
        // 音源接口按 songmid 取封面，但歌单里存的歌曲常常只有 songId（酷我等），这里兜一下
        const meta = info.meta as { songmid?: string, songId?: string }
        const sdkInfo = { ...info, songmid: meta.songmid ?? meta.songId ?? '' }
        url = await sdk?.getPic?.(sdkInfo) ?? ''
      } catch (err) {
        log.warn(`get pic failed: ${info.source} ${info.id}`)
      }
      cache.set(info.id, url)
      pendingTasks.delete(info.id)
      return url
    })()
    pendingTasks.set(info.id, task)
  }
  return task
}
