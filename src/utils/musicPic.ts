import musicSdk from '@/utils/musicSdk'
import { log } from '@/utils/log'
import BackgroundTimer from 'react-native-background-timer'

interface MusicSdk {
  getPic?: (info: LX.Music.MusicInfo) => Promise<string>
}

// 封面请求超时（ms）：音源脚本偶发回调丢失会让请求永久挂起（既不成功也不失败），
// 导致封面永远停在「等待中」——超时按取不到处理（写空缓存、显示占位）
const PIC_TIMEOUT = 8000

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
        // race 超时：挂起的请求按取不到处理（不然后面所有依赖它的链路全部悬停）
        url = await Promise.race([
          sdk?.getPic?.(sdkInfo) ?? Promise.resolve(''),
          new Promise<string>((resolve) => {
            BackgroundTimer.setTimeout(() => { resolve('') }, PIC_TIMEOUT)
          }),
        ]) ?? ''
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

/**
 * 只读缓存版：查 meta.picUrl 和已缓存的封面地址，**不发请求**（未缓存返回 null）。
 * 供播放器取封面的链路短路用——滑动切歌前预取过封面的歌，切歌瞬间 URL 就可用，不用再等音源接口
 */
export const getCachedMusicPicUrl = (info: LX.Music.MusicInfo): string | null => {
  if (info.meta.picUrl) return info.meta.picUrl
  return cache.get(info.id) ?? null
}

/**
 * 后台预热歌曲的封面地址（fire-and-forget，内部按歌曲 id 缓存、重复调用安全）。
 * 在「决定下一首/相邻歌」的入口调用（滑动预览、心动推歌、播放核心取下一首、切歌总入口），
 * 让封面请求提前到切歌之前——切歌瞬间 URL 已就绪，不会出现「歌词歌名已变、封面还是上一首」的空窗
 */
export const prefetchMusicPicUrl = (info: LX.Music.MusicInfo | LX.Download.ListItem | null | undefined) => {
  if (!info) return
  const music = 'progress' in info ? info.metadata.musicInfo : info
  if (!music.id || music.meta.picUrl) return
  void getMusicPicUrl(music).catch(() => {})
}
