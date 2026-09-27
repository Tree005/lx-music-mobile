import { addPlayedList, clearPlayedList } from '@/core/player/playedList'
import { pause, playNext } from '@/core/player/player'
import { setStatusText, setIsPlay } from '@/core/player/playStatus'
// import { resetPlayerMusicInfo } from '@/core/player/playInfo'
import { setStop } from '@/plugins/player'
import { delayUpdateMusicInfo } from '@/plugins/player/playList'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'


export default async(setting: LX.AppSetting) => {
  const setPlayStatus = () => {
    setIsPlay(true)
  }
  const setPauseStatus = () => {
    setIsPlay(false)
    if (global.lx.isPlayedStop) void pause()
  }

  const handleEnded = () => {
    // TODO(dbg): 排查连环跳歌用，定位后删
    console.log('[dbg] playerEnded', playerState.progress.nowPlayTime, playerState.progress.maxPlayTime, 'playedStop=', global.lx.isPlayedStop)
    // setTimeout(() => {
    if (global.lx.isPlayedStop) {
      setStatusText(global.i18n.t('player__end'))
      return
    }
    // 兜底：切歌/切前后台时 RNTP 偶尔会把「占位轨道」当成当前曲目而误报播放结束，
    // 已知时长且明显没播完就忽略这次结束事件，避免连环跳歌
    const { nowPlayTime, maxPlayTime } = playerState.progress
    if (maxPlayTime > 30 && nowPlayTime < maxPlayTime * 0.5) return
    // 切歌保护窗口内（正在切歌/取链接）的结束事件也忽略，且不清进度避免闪回 0
    if (Date.now() < global.lx.switchMusicGuardUntil) return
    // resetPlayerMusicInfo()
    // global.app_event.stop()
    global.app_event.setProgress(0)
    setStatusText(global.i18n.t('player__end'))
    void playNext(true)
    // })
  }

  const setStopStatus = () => {
    setIsPlay(false)
    setStatusText('')
    void setStop()
  }

  const updatePic = () => {
    if (!settingState.setting['player.isShowNotificationImage']) return
    if (playerState.playMusicInfo.musicInfo && playerState.musicInfo.pic) {
      delayUpdateMusicInfo(playerState.musicInfo)
    }
  }

  const handleConfigUpdated: typeof global.state_event.configUpdated = (keys, settings) => {
    if (keys.includes('player.togglePlayMethod')) {
      const newValue = settings['player.togglePlayMethod']
      if (playerState.playedList.length) clearPlayedList()
      const playMusicInfo = playerState.playMusicInfo
      if (newValue == 'random' && playMusicInfo.musicInfo && !playMusicInfo.isTempPlay) addPlayedList({ ...(playMusicInfo as LX.Player.PlayMusicInfo) })
    }
  }


  global.app_event.on('play', setPlayStatus)
  global.app_event.on('pause', setPauseStatus)
  global.app_event.on('error', setPauseStatus)
  global.app_event.on('stop', setStopStatus)
  global.app_event.on('playerEnded', handleEnded)
  global.app_event.on('picUpdated', updatePic)
  global.state_event.on('configUpdated', handleConfigUpdated)
}
