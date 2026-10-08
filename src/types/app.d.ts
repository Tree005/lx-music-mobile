/* eslint-disable no-var */
import type { AppEventTypes } from '@/event/appEvent'
import type { ListEventTypes } from '@/event/listEvent'
import type { DislikeEventTypes } from '@/event/dislikeEvent'
import type { StateEventTypes } from '@/event/stateEvent'
import type { I18n } from '@/lang/i18n'
import type { Buffer as _Buffer } from 'buffer'

// interface Process {
//   env: {
//     NODE_ENV: 'development' | 'production'
//   }
//   versions: {
//     app: string
//   }
// }
interface GlobalData {
  fontSize: number
  gettingUrlId: string

  // event_app: AppType
  // event_list: ListType

  playerStatus: {
    isInitialized: boolean
    isRegisteredService: boolean
    isIniting: boolean
  }
  restorePlayInfo: LX.Player.SavedPlayInfo | null
  isScreenKeepAwake: boolean
  isPlayedStop: boolean
  isEnableSyncLog: boolean
  isEnableUserApiLog: boolean
  playerTrackId: string

  qualityList: LX.QualityList
  apis: Partial<LX.UserApi.UserApiSources>
  apiInitPromise: [Promise<boolean>, boolean, (success: boolean) => void]

  jumpMyListPosition: boolean


  /**
   * 歌单详情页当前查看的歌单 id（歌单详情是独立子页面，靠它传参）
   */
  songlistDetailListId: string

  /**
   * 首页是否正在滚动中，用于防止意外误触播放歌曲
   */
  homePagerIdle: boolean

  /**
   * 心动页（随机推歌）的切歌处理器：播放上下文在心动列表（LIST_IDS.AI_RADIO）时，
   * 播放器的下一曲 / 上一曲由它提供（见 core/player/player.ts 里的分支）。
   * 用户没进过心动页时为 null，此时播放器不会出现心动上下文，无需兜底
   */
  aiRadioHandler: {
    /** 取下一首（心动流：队尾随机推新、回退过则顺序恢复；结果会被缓存，预览与实播一致） */
    getNext: () => Promise<LX.Player.PlayMusicInfo | null>
    /** 取上一首（心动流历史：心动列表里当前歌的前一首） */
    getPrev: () => LX.Player.PlayMusicInfo | null
    /** 把即将播放的歌同步进心动列表（在 setPlayMusicInfo 之前调用，避免播放器重算索引时歌还不在列表里） */
    prepare?: (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => void
  } | null

  // windowInfo: {
  //   screenW: number
  //   screenH: number
  //   fontScale: number
  //   pixelRatio: number
  //   screenPxW: number
  //   screenPxH: number
  // }

  // syncKeyInfo: LX.Sync.KeyInfo
}


declare global {
  var isDev: boolean
  var lx: GlobalData
  var i18n: I18n
  var app_event: AppEventTypes
  var list_event: ListEventTypes
  var dislike_event: DislikeEventTypes
  var state_event: StateEventTypes

  var Buffer: typeof _Buffer

  module NodeJS {
    interface ProcessVersions {
      app: string
    }
  }
  // var process: Process
}
