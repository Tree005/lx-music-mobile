import Lyric, { type Lines } from 'lrc-file-parser'
import { LIST_IDS } from '@/config/constant'
import { getListMusics } from '@/core/list'
import { playListById, prefetchPlayMusicUrl } from '@/core/player/player'
import { setProgress } from '@/core/player/progress'
import { getLyricInfo } from '@/core/music'
import { getListMusicSync, setMusicList, userLists } from '@/utils/listManage'
import { removeListMusics } from '@/utils/data'
import { prefetchMusicPicUrl } from '@/utils/musicPic'
import playerState from '@/store/player/state'
import { getRandom } from '@/utils/common'
import { log } from '@/utils/log'

// ================= 心动流（心动页的独立播放会话） =================
// 设计要点（与需求确认稿对应）：
// 1. 心动流 = 一个「隐藏列表」AI_RADIO 的播放上下文：列表只在内存里维护（不落盘、重启清空），
//    内容按「推过的顺序」追加；播放上下文切到它，即心动流接手播放；
// 2. 推歌池 = 收藏 + 全部歌单合集（按 id 去重），每次开新会话时构建，抽歌时避开最近推过的；
// 3. 切歌：「下一首」= 队尾随机推新（此前回退过则先顺序恢复），「上一首」= 列表里的前一首（播放历史）。
//    播放器的下一曲 / 上一曲（控制按钮、播完自动、通知栏）都走 core/player/player.ts 里注册的分支，
//    由下面注册的 aiRadioHandler 提供结果，保证与预览（滑进来的歌）一致；
// 4. 会话快照：上下文被普通播放切走时，记住「最后的心动歌 + 进度」，回到心动页可接着听；
// 5. 挂起态的歌词在这一层单独解析：全局歌词单例跟的是「全局当前歌」，挂起时对不上。

/** 挂起快照：上下文被切走后记住的心动歌与进度 */
export interface AiRadioSnapshot {
  musicInfo: LX.Music.MusicInfo
  time: number
  maxTime: number
}

interface AiRadioSession {
  snapshot: AiRadioSnapshot | null
  /** 挂起态的歌词（独立解析，不与全局歌词单例混用） */
  lyricLines: Lines
  /** 上面歌词对应的歌 id（用于判断是否需要重新加载） */
  lyricMusicId: string | null
  /** 推歌池为空（没有任何收藏 / 歌单） */
  poolEmpty: boolean
  /** 正在开新会话（构建池子中） */
  starting: boolean
}

const session: AiRadioSession = {
  snapshot: null,
  lyricLines: [],
  lyricMusicId: null,
  poolEmpty: false,
  starting: false,
}

// 会话内缓存的推歌池（startSession 时构建）
let pool: LX.Music.MusicInfo[] | null = null
// 「下一首」的预取缓存：预览（跟手时滑进来的歌）与实际播放保证是同一首
let prefetchedNext: LX.Player.PlayMusicInfo | null = null
// 心动流最近播放的歌与进度：离开上下文时用它落快照。
// 注意不能到「离开时现读」——事件是 setImmediate 异步派发的，
// 回调执行时 playerState 已经被新歌覆盖了
let lastMusic: LX.Music.MusicInfo | null = null
let lastTime = 0
let lastMaxTime = 0

// ------- 会话状态订阅（给 UI 的 hook 用） -------

export interface AiRadioView {
  snapshot: AiRadioSnapshot | null
  lyricLines: Lines
  poolEmpty: boolean
  starting: boolean
}

const listeners = new Set<() => void>()
let viewCache: AiRadioView | null = null

export const getAiRadioView = (): AiRadioView => {
  return viewCache ??= {
    snapshot: session.snapshot,
    lyricLines: session.lyricLines,
    poolEmpty: session.poolEmpty,
    starting: session.starting,
  }
}

export const subscribeAiRadio = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = () => {
  viewCache = null
  for (const listener of listeners) listener()
}

// ------- 基础工具 -------

const toMusicInfo = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem): LX.Music.MusicInfo => {
  return 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
}

/** 当前播放上下文是否在心动流里 */
export const isAiRadioActive = () => playerState.playInfo.playerListId == LIST_IDS.AI_RADIO

/** 心动流的「当前歌」：活跃时取实时播放的歌，挂起时取快照歌 */
const getCurrentMusic = (): LX.Music.MusicInfo | null => {
  if (isAiRadioActive()) {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (musicInfo) return toMusicInfo(musicInfo)
  }
  return session.snapshot?.musicInfo ?? null
}

const broadcastListUpdate = () => {
  global.app_event.myListMusicUpdate([LIST_IDS.AI_RADIO])
}

/** 确保歌曲在心动列表里（先入列再播放，播放器重算索引时不会出现「歌不在列表」） */
const ensureInList = (musicInfo: LX.Music.MusicInfo) => {
  const list = getListMusicSync(LIST_IDS.AI_RADIO)
  if (list.some(item => item.id == musicInfo.id)) return
  list.push(musicInfo)
  setMusicList(LIST_IDS.AI_RADIO, list)
  broadcastListUpdate()
}

/** 构建推歌池：收藏 + 收藏/导入/自建的歌单，按 id 去重 */
const buildPool = async(): Promise<LX.Music.MusicInfo[]> => {
  const ids = new Set<string>()
  const list: LX.Music.MusicInfo[] = []
  const add = (musics: LX.Music.MusicInfo[]) => {
    for (const music of musics) {
      if (!music.id || ids.has(music.id)) continue
      ids.add(music.id)
      list.push(music)
    }
  }
  add(await getListMusics(LIST_IDS.LOVE))
  for (const userList of [...userLists]) add(await getListMusics(userList.id))
  return list
}

/** 从池子里随机推一首新歌（尽量避开最近推过的；小池子抽无可抽时允许重复） */
const pickNewMusic = (): LX.Music.MusicInfo | null => {
  if (!pool?.length) return null
  const list = getListMusicSync(LIST_IDS.AI_RADIO)
  const recentCount = Math.min(50, Math.max(0, pool.length - 1))
  const recentIds = new Set<string>()
  for (let i = list.length - 1; i >= 0 && i >= list.length - recentCount; i--) recentIds.add(list[i].id)
  let candidates = pool.filter(music => !recentIds.has(music.id))
  if (!candidates.length) candidates = pool
  return candidates[getRandom(0, candidates.length)]
}

const parseLyricText = async(text: string): Promise<Lines> => {
  return new Promise((resolve) => {
    if (!text) {
      resolve([])
      return
    }
    const lrc = new Lyric({
      onSetLyric: (lines: Lines) => { resolve(lines) },
    })
    lrc.setLyric(text)
  })
}

// ------- 对外操作 -------

/** 播放指定的心动歌（不在列表会先入列；挂起恢复 / 空态开播 / 滑动切歌都走它） */
export const playAiRadioMusic = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  const music = toMusicInfo(musicInfo)
  ensureInList(music)
  await playListById(LIST_IDS.AI_RADIO, music.id)
}

/** 开新会话：重建推歌池、清空心动列表、随机推一首开始播（池子为空返回 false） */
export const startSession = async(): Promise<boolean> => {
  if (session.starting) return false
  session.starting = true
  notify()
  let newPool: LX.Music.MusicInfo[]
  try {
    newPool = await buildPool()
  } catch (err) {
    session.starting = false
    notify()
    log.warn('ai radio build pool failed:', err as string)
    return false
  }
  session.starting = false
  if (!newPool.length) {
    session.poolEmpty = true
    notify()
    return false
  }
  session.poolEmpty = false
  pool = newPool
  // 新会话从空列表开始（上一次会话的推歌记录不延续）
  setMusicList(LIST_IDS.AI_RADIO, [])
  broadcastListUpdate()
  prefetchedNext = null
  const musicInfo = pickNewMusic()
  if (!musicInfo) {
    session.poolEmpty = true
    notify()
    return false
  }
  await playAiRadioMusic(musicInfo)
  notify()
  return true
}

/** 恢复挂起的心动流：从快照歌 + 上次进度继续播 */
export const resumeSession = async() => {
  const snapshot = session.snapshot
  if (!snapshot) return
  await playAiRadioMusic(snapshot.musicInfo)
  // 恢复进度：playListById 内部会把进度清零，这里在它之后补上。
  // 歌曲 URL 还在异步获取（setMusicUrl 有 debounce），起播时 setResource 会取这个进度做 seek
  if (snapshot.time > 0.5) setProgress(snapshot.time, snapshot.maxTime)
}

/** 「下一首」：回退过就顺序恢复，到队尾随机推新（结果会缓存，滑动预览与实际播放一致） */
export const getAiRadioNext = async(): Promise<LX.Player.PlayMusicInfo | null> => {
  const info = await fetchAiRadioNext()
  // 决定歌的瞬间就预热封面与音频 URL：滑动预览 / 自动跳歌都在这里，切歌前两者都已开始取
  if (info) {
    prefetchMusicPicUrl(info.musicInfo)
    prefetchPlayMusicUrl(info.musicInfo)
  }
  return info
}

const fetchAiRadioNext = async(): Promise<LX.Player.PlayMusicInfo | null> => {
  if (prefetchedNext) return prefetchedNext
  const current = getCurrentMusic()
  if (!current) return null
  const list = getListMusicSync(LIST_IDS.AI_RADIO)
  const index = list.findIndex(music => music.id == current.id)
  if (index >= 0 && index < list.length - 1) {
    return { musicInfo: list[index + 1], listId: LIST_IDS.AI_RADIO, isTempPlay: false }
  }
  const musicInfo = pickNewMusic()
  if (!musicInfo) return null
  prefetchedNext = { musicInfo, listId: LIST_IDS.AI_RADIO, isTempPlay: false }
  return prefetchedNext
}

/** 「上一首」：心动列表里的前一首（本次会话的播放历史），没有则 null */
export const getAiRadioPrev = (): LX.Player.PlayMusicInfo | null => {
  const info = fetchAiRadioPrev()
  if (info) {
    prefetchMusicPicUrl(info.musicInfo)
    prefetchPlayMusicUrl(info.musicInfo)
  }
  return info
}

const fetchAiRadioPrev = (): LX.Player.PlayMusicInfo | null => {
  const current = getCurrentMusic()
  if (!current) return null
  const list = getListMusicSync(LIST_IDS.AI_RADIO)
  const index = list.findIndex(music => music.id == current.id)
  if (index > 0) return { musicInfo: list[index - 1], listId: LIST_IDS.AI_RADIO, isTempPlay: false }
  return null
}

/**
 * 进入心动页时调用：
 * - 心动流活跃 → 不动；
 * - 有别的音乐正在响 → 不抢（页面显示快照的暂停态 / 空态）；
 * - 其余情况（没在响）→ 有快照就续播快照，否则开新会话随机推歌
 */
let entering = false
export const enterAiRadioPage = () => {
  if (entering) return
  entering = true
  void (async() => {
    // 真活跃（本进程开过会话）才不动；池子为空说明是「重启后从持久化恢复出来的残留上下文」，
    // 按未开始处理（重开会话）
    if (isAiRadioActive() && pool?.length) return
    if (playerState.isPlay) return
    if (session.snapshot) await resumeSession()
    else await startSession()
  })().catch((err) => {
    log.warn('ai radio enter failed:', err as string)
  }).finally(() => {
    entering = false
  })
}

/** 挂起态歌词：按需加载 + 独立解析，结果缓存在会话里（不给全局歌词单例添乱） */
export const ensureSuspendedLyric = () => {
  const snapshot = session.snapshot
  if (!snapshot) return
  if (session.lyricMusicId == snapshot.musicInfo.id) return
  session.lyricMusicId = snapshot.musicInfo.id
  session.lyricLines = []
  notify()
  void getLyricInfo({ musicInfo: snapshot.musicInfo }).then((info) => {
    if (session.lyricMusicId != snapshot.musicInfo.id) return
    void parseLyricText(info.lyric).then((lines) => {
      if (session.lyricMusicId != snapshot.musicInfo.id) return
      session.lyricLines = lines
      notify()
    })
  }).catch((err) => {
    // 回滚标记：允许下次进入挂起态时重试（否则同歌永远不再加载，歌词一直空白）
    if (session.lyricMusicId == snapshot.musicInfo.id) session.lyricMusicId = null
    log.warn('ai radio load suspended lyric failed:', err as string)
  })
}

// ------- 与播放核心的接线 -------

// 清掉历史遗留的持久化数据（早期调试/操作可能把心动列表写进过存储）：
// 心动列表只在内存里维护，重启后不做恢复（见 core/init/player/playInfo.ts 的跳过逻辑）
void removeListMusics([LIST_IDS.AI_RADIO])

// 播放器的「下一曲 / 上一曲」在心动上下文里由这里提供（见 core/player/player.ts 的分支）
global.lx.aiRadioHandler = {
  getNext: getAiRadioNext,
  getPrev: getAiRadioPrev,
  prepare: (musicInfo) => { ensureInList(toMusicInfo(musicInfo)) },
}

let prevPlayerListId: string | null = null

// 播放上下文变化：离开心动列表时落快照
// （用持续维护的 lastMusic / lastTime，回调执行时 playerState 已被新歌覆盖，不能现读）
global.state_event.on('playInfoChanged', (playInfo) => {
  const playerListId = playInfo.playerListId
  if (prevPlayerListId == LIST_IDS.AI_RADIO && playerListId != LIST_IDS.AI_RADIO) {
    if (lastMusic) {
      session.snapshot = { musicInfo: lastMusic, time: lastTime, maxTime: lastMaxTime }
      if (session.lyricMusicId != lastMusic.id) {
        session.lyricLines = []
        session.lyricMusicId = null
      }
      notify()
    }
  }
  prevPlayerListId = playerListId
})

// 心动歌开始播放：
// - 补进心动列表（播完自动 / 手动切歌走核心分支时不经过 playAiRadioMusic）；
// - 任何切歌都清掉「下一首」预取（旧预取基于旧状态）；
// - 记录「最后的心动歌」，供离开时落快照
global.state_event.on('playMusicInfoChanged', () => {
  const { listId, musicInfo } = playerState.playMusicInfo
  if (listId != LIST_IDS.AI_RADIO || !musicInfo) return
  const music = toMusicInfo(musicInfo)
  prefetchedNext = null
  ensureInList(music)
  if (lastMusic?.id != music.id) {
    lastMusic = music
    lastTime = 0
    lastMaxTime = 0
  }
})

// 持续记录心动歌的进度（快照要的是「离开前一刻」的进度）
global.state_event.on('playProgressChanged', () => {
  if (!isAiRadioActive()) return
  lastTime = playerState.progress.nowPlayTime
  lastMaxTime = playerState.progress.maxPlayTime
})
