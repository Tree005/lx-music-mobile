import { memo, useRef, useEffect, useCallback } from 'react'
import { View, AppState } from 'react-native'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'

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
  // 竖向两页：封面页（封面 + 两行歌词 + 歌曲信息）与全屏歌词页
  // 上滑看歌词、下滑回封面；也支持点封面/嵌入歌词进、点歌词页回
  const showLyricRef = useRef(false)
  const pagerRef = useRef<PagerView>(null)

  const showFullLyric = useCallback(() => {
    pagerRef.current?.setPage(1)
  }, [])
  const hideFullLyric = useCallback(() => {
    pagerRef.current?.setPage(0)
  }, [])

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    showLyricRef.current = nativeEvent.position == 1
    if (showLyricRef.current) screenkeepAwake()
    else screenUnkeepAwake()
  }

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
        <PagerView
          ref={pagerRef}
          orientation="vertical"
          onPageSelected={onPageSelected}
          // 关掉滑到首尾时的过度滚动拉伸效果（安卓 12+ 会看到页面被拖拽变形）
          overScrollMode="never"
          style={styles.pagerView}
        >
          <View collapsable={false}>
            <Pic componentId={componentId} onPress={showFullLyric} />
            <LyricInline onPress={showFullLyric} />
            <SongInfo />
          </View>
          <View collapsable={false}>
            <Lyric onPress={hideFullLyric} />
          </View>
        </PagerView>
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
  pagerView: {
    flex: 1,
  },
})
