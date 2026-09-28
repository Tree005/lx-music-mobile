import { playNext, setMusicUrl, autoToggleSourceReplay } from '@/core/player/player'
import { setStatusText } from '@/core/player/playStatus'
import { getPosition, isEmpty, setStop } from '@/plugins/player'
import { isActive } from '@/utils/tools'
import BackgroundTimer from 'react-native-background-timer'
import playerState from '@/store/player/state'
import { setNowPlayTime } from '@/core/player/progress'


export default () => {
  let retryNum = 0
  let prevTimeoutId: string | null = null

  let loadingTimeout: number | null = null
  let delayNextTimeout: number | null = null
  const startLoadingTimeout = () => {
    // console.log('start load timeout')
    clearLoadingTimeout()
    loadingTimeout = BackgroundTimer.setTimeout(() => {
      // if (global.lx.isPlayedStop) {
      //   prevTimeoutId = null
      //   setStatusText('')
      //   return
      // }

      // 如果加载超时，则尝试刷新URL
      if (prevTimeoutId == playerState.musicInfo.id) {
        prevTimeoutId = null
        void playNext(true)
      } else {
        prevTimeoutId = playerState.musicInfo.id
        if (playerState.playMusicInfo.musicInfo) setMusicUrl(playerState.playMusicInfo.musicInfo, true)
      }
    }, 25000)
  }
  const clearLoadingTimeout = () => {
    if (!loadingTimeout) return
    // console.log('clear load timeout')
    BackgroundTimer.clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  const clearDelayNextTimeout = () => {
    // console.log(this.delayNextTimeout)
    if (!delayNextTimeout) return
    BackgroundTimer.clearTimeout(delayNextTimeout)
    delayNextTimeout = null
  }
  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    delayNextTimeout = BackgroundTimer.setTimeout(() => {
      if (global.lx.isPlayedStop) {
        setStatusText('')
        return
      }
      void playNext(true)
    }, 5000)
  }

  const handleLoadstart = () => {
    console.log('handleLoadstart', playerState.isPlay)
    if (global.lx.isPlayedStop || !playerState.isPlay) return
    startLoadingTimeout()
    setStatusText(global.i18n.t('player__loading'))
  }

  // const handleLoadeddata = () => {
  //   setStatusText(global.i18n.t('player__loading'))
  // }

  // const handleCanplay = () => {
  //   setStatusText('')
  // }

  const handlePlaying = () => {
    setStatusText('')
    clearLoadingTimeout()
  }

  const handleEmpied = () => {
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  const handleWating = () => {
    setStatusText(global.i18n.t('player__buffering'))
  }

  const handleError = () => {
    if (!playerState.musicInfo.id) return
    clearLoadingTimeout()
    if (global.lx.isPlayedStop) return

    const handlePlayErrorFallback = () => {
      if (!isEmpty()) void setStop()
      if (isActive()) {
        setStatusText(global.i18n.t('player__error'))
        setTimeout(addDelayNextTimeout)
      } else {
        console.warn('error skip to next')
        void playNext(true)
      }
    }

    if (playerState.playMusicInfo.musicInfo && retryNum < 2) { // 若音频URL无效则尝试刷新：第1次原源刷新，第2次自动换源重播
      let musicInfo = playerState.playMusicInfo.musicInfo
      void getPosition().then((position) => {
        if (position) setNowPlayTime(position)
      }).finally(() => {
        if (playerState.playMusicInfo.musicInfo !== musicInfo) return
        retryNum++
        if (retryNum < 2) {
          setMusicUrl(playerState.playMusicInfo.musicInfo, true)
          setStatusText(global.i18n.t('player__refresh_url'))
        } else {
          // 原源重试仍失败：自动换源重播（跳过 QQ 源）；无可用候选时走原有兜底
          void autoToggleSourceReplay(musicInfo).then((toggled) => {
            if (!toggled) handlePlayErrorFallback()
          })
        }
      })
      return
    }
    handlePlayErrorFallback()
  }

  const handleSetPlayInfo = () => {
    retryNum = 0
    prevTimeoutId = null
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  // const handlePlayedStop = () => {
  //   clearDelayNextTimeout()
  //   clearLoadingTimeout()
  // }


  global.app_event.on('playerLoadstart', handleLoadstart)
  // global.app_event.on('playerLoadeddata', handleLoadeddata)
  // global.app_event.on('playerCanplay', handleCanplay)
  global.app_event.on('playerPlaying', handlePlaying)
  global.app_event.on('playerWaiting', handleWating)
  global.app_event.on('playerEmptied', handleEmpied)
  global.app_event.on('playerError', handleError)
  global.app_event.on('musicToggled', handleSetPlayInfo)
}
