import { memo, useEffect, useCallback, useRef, useState } from 'react'
import { View, AppState } from 'react-native'

import Header from './components/Header'
import ToolsBar from './components/ToolsBar'
// import Aside from './components/Aside'
// import Main from './components/Main'
import Player from './Player'
import Pic, { COVER_BOTTOM_MARGIN } from './Pic'
import Lyric from './Lyric'
import LyricInline from './LyricInline'
import SongInfo from './SongInfo'
import Background from '../components/Background'
import SwipeSongContainer, { type SwipeSongContainerType } from '../components/SwipeSongContainer'
import PageSlider from '../components/PageSlider'
import { useAdjacentMusic } from '../hooks/useAdjacentMusic'
import { playNext, playPrev } from '@/core/player/player'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
// import { useTheme } from '@/store/theme/hook'

// global.iskeep = false
export default memo(({ componentId }: { componentId: string }) => {
  // const theme = useTheme()
  // 竖向两页：封面页（封面 + 两行歌词 + 歌曲信息）与全屏歌词页。
  // 翻页由 PageSlider（纯 JS）承担：上滑看歌词、点封面/嵌入歌词进、点歌词页回
  const [showLyric, setShowLyric] = useState(false)
  // AppState 回调里要用最新值（effect 闭包在挂载时固化，不能用 state）
  const showLyricRef = useRef(false)

  const showFullLyric = useCallback(() => {
    setShowLyric(true)
  }, [])
  const hideFullLyric = useCallback(() => {
    setShowLyric(false)
  }, [])

  // 看歌词页时保持屏幕常亮（进评论页时取消，回歌词页恢复，见下面的 AppState / componentIds）
  useEffect(() => {
    showLyricRef.current = showLyric
    if (showLyric) screenkeepAwake()
    else screenUnkeepAwake()
  }, [showLyric])

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

  // 内容区（歌词页 / 封面页容器）实测高度与「封面以下内容」实测高度：用来把封面收缩到放得下的大小。
  // 不用窗口尺寸推算——进页面瞬间拿到的窗口数据可能偏大，算出来的封面会把
  // 歌词/信息行挤出页面，表现为进度条压在歌手行上（偶发错位）
  const [pagerHeight, setPagerHeight] = useState(0)
  const [belowCoverHeight, setBelowCoverHeight] = useState(0)
  // 封面实测尺寸（跟手滑动的预览封面按它对齐）
  const [coverSize, setCoverSize] = useState(0)
  const musicInfo = usePlayerMusicInfo()

  // 左右滑动切歌：预览与实际播放保证一致（随机播放见 useAdjacentMusic 的说明）
  const { fetchNext, fetchPrev } = useAdjacentMusic()
  const handleSwipeNext = useCallback(() => { void playNext() }, [])
  const handleSwipePrev = useCallback(() => { void playPrev() }, [])
  // 点击上一首/下一首按钮：走同款滑动动画（视觉与手势滑动连续）
  const swipeRef = useRef<SwipeSongContainerType>(null)
  const handleTriggerNext = useCallback(() => { swipeRef.current?.triggerSwipe(1) }, [])
  const handleTriggerPrev = useCallback(() => { swipeRef.current?.triggerSwipe(-1) }, [])

  // 上下滑看歌词：封面页支持「上滑跟手」（PageSlider 拖动轨道）；回封面用点击（歌词列表要能正常滚动）
  const canDrag = !showLyric
  const handleDragSettled = useCallback(() => {
    showFullLyric()
  }, [showFullLyric])

  return (
    <View style={styles.page}>
      <Background />
      <Header />
      <View style={styles.container}>
        <SwipeSongContainer
          ref={swipeRef}
          currentKey={musicInfo.id ?? ''}
          coverSize={coverSize}
          coverBottomSpace={belowCoverHeight > 0 ? belowCoverHeight + COVER_BOTTOM_MARGIN : 0}
          fetchNext={fetchNext}
          fetchPrev={fetchPrev}
          onSwipeNext={handleSwipeNext}
          onSwipePrev={handleSwipePrev}
        >
          <PageSlider
            page={showLyric ? 1 : 0}
            onHeightChange={setPagerHeight}
            canDrag={canDrag}
            onDragSettled={handleDragSettled}
          >
            <View style={{ height: pagerHeight > 0 ? pagerHeight : undefined }}>
              <Pic
                componentId={componentId}
                pagerHeight={pagerHeight}
                belowCoverHeight={belowCoverHeight}
                onPress={showFullLyric}
                onCoverSize={setCoverSize}
              />
              <View onLayout={({ nativeEvent }) => { setBelowCoverHeight(nativeEvent.layout.height) }}>
                <LyricInline onPress={showFullLyric} />
                <SongInfo />
              </View>
            </View>
            <View style={styles.lyricPage}>
              <Lyric onPress={hideFullLyric} />
            </View>
          </PageSlider>
        </SwipeSongContainer>
        {/* 上一首/下一首按钮走滑动动画（覆盖回调同样有幽灵点击防御） */}
        <Player overrides={{ onNext: handleTriggerNext, onPrev: handleTriggerPrev }} />
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
  // 歌词页要撑满翻页容器（页内容是 flex 布局）
  lyricPage: {
    flex: 1,
  },
})
