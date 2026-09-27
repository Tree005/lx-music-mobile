import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { View, AppState, Pressable } from 'react-native'

import Header from './components/Header'
import ToolsBar from './components/ToolsBar'
// import Aside from './components/Aside'
// import Main from './components/Main'
import Player from './Player'
import Pic from './Pic'
import Lyric from './Lyric'
import LyricInline from './LyricInline'
import SongInfo from './SongInfo'
import Background from '../components/Background'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
// import { useTheme } from '@/store/theme/hook'

// global.iskeep = false
export default memo(({ componentId }: { componentId: string }) => {
  // const theme = useTheme()
  // 封面视图 ⇄ 全屏歌词视图（点封面或嵌入歌词进入，点歌词区域返回）
  const [showLyric, setShowLyric] = useState(false)
  const showLyricRef = useRef(false)

  const showFullLyric = useCallback(() => {
    showLyricRef.current = true
    setShowLyric(true)
    screenkeepAwake()
  }, [])

  const hideFullLyric = useCallback(() => {
    showLyricRef.current = false
    setShowLyric(false)
    screenUnkeepAwake()
  }, [])

  useEffect(() => {
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (showLyricRef.current && !commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.page}>
      <Background />
      <Header />
      <View style={styles.container}>
        {
          showLyric
            ? (
                // 全屏歌词占满上半区，点歌词区域返回封面视图
                <Pressable style={styles.lyricArea} onPress={hideFullLyric}>
                  <Lyric />
                </Pressable>
              )
            : (
                <>
                  <Pic componentId={componentId} onPress={showFullLyric} />
                  <LyricInline onPress={showFullLyric} />
                  <SongInfo />
                </>
              )
        }
        <Player />
        <ToolsBar />
      </View>
    </View>
  )
})

const styles = createStyle({
  page: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  lyricArea: {
    flex: 1,
    flexShrink: 1,
  },
})
