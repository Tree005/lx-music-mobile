import { getMusicUrl } from '@/core/music'

// 切歌的「音频 URL 预取」：在「决定下一首」的瞬间（滑动预览 / 心动推歌 / 播放条相邻歌）
// 就把 URL 取好——getMusicUrl 内部会把结果写进持久缓存（@music_url），
// 真正切歌时播放链的 getStoreMusicUrl 直接命中，把原来 1~3s 的等链接时间压在切歌之前。
// 与播放链同源（同一个 getMusicUrl、同一套音质计算），allowToggleSource 保持默认 true：
// 原源取不到时会像播放时一样换源，并把可用的 URL 存进缓存——切歌即出声。
//
// 说明（对齐封面预取 musicPic.ts 的策略）：fire-and-forget、按歌曲 id 去重、
// 失败静默（播放链照常走原路径，什么都不影响）

// 在途请求：同一首歌并发触发时只发一次
const pending = new Map<string, Promise<void>>()
// 失败冷却：避免每次预览刷新都对取不到 URL 的歌重发请求（音源侧有 tooManyRequests 限流）
const failedAt = new Map<string, number>()
const FAIL_COOLDOWN = 30 * 1000

/**
 * 预取歌曲的播放 URL（fire-and-forget，内部去重、重复调用安全）。
 * 只处理在线歌：本地歌曲的 URL 本来就是本地路径，下载项跳过（文件已在本地）
 */
export const prefetchMusicUrl = (info: LX.Music.MusicInfo | LX.Download.ListItem | null | undefined) => {
  if (!info) return
  if ('progress' in info) return
  if (!info.id || info.source == 'local') return
  if (pending.has(info.id)) return
  const failed = failedAt.get(info.id)
  if (failed != null && Date.now() - failed < FAIL_COOLDOWN) return

  const task = getMusicUrl({ musicInfo: info }).then(() => {
    failedAt.delete(info.id)
  }).catch(() => {
    failedAt.set(info.id, Date.now())
  }).then(() => {
    pending.delete(info.id)
  })
  pending.set(info.id, task)
}
