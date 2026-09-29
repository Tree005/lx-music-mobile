import settingState from '@/store/setting/state'
import { useSettingValue } from '@/store/setting/hook'

// 主音源：设置里「主音源」选定的源。全 App 的浏览数据（搜索页热搜/榜单、首页推荐歌单等）
// 与播放优先匹配都使用它，保证各处数据源一致。
// 历史数据里该值可能为空，读取时统一归一化为默认源（小蜗）
export const DEFAULT_MAIN_SOURCE: LX.OnlineSource = 'kw'

export const getMainSource = (): LX.OnlineSource =>
  settingState.setting['player.playPrioritySource'] || DEFAULT_MAIN_SOURCE

// UI 用：跟随设置变化自动刷新（主源改了，页面数据要跟着换）
export const useMainSource = (): LX.OnlineSource =>
  useSettingValue('player.playPrioritySource') || DEFAULT_MAIN_SOURCE
