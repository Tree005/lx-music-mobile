import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import SwipeSongContainer, { toPreviewMusicInfo, type SwipeSongContainerType } from '@/screens/PlayDetail/components/SwipeSongContainer'
import PageSlider from '@/screens/PlayDetail/components/PageSlider'
import Pic, { COVER_BOTTOM_MARGIN } from '@/screens/PlayDetail/Vertical/Pic'
import Lyric from '@/screens/PlayDetail/Vertical/Lyric'
import LyricInline from '@/screens/PlayDetail/Vertical/LyricInline'
import SongInfo from '@/screens/PlayDetail/Vertical/SongInfo'
import Player from '@/screens/PlayDetail/Vertical/Player'
import MorePopup, { type MorePopupType } from '@/screens/PlayDetail/Vertical/components/MorePopup'
import { getAiRadioNext, getAiRadioPrev, playAiRadioMusic } from '@/core/aiRadio'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useNavActiveId } from '@/store/common/hook'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'
import { createStyle } from '@/utils/tools'

// 心动页 · 活跃态：心动流正在播（全局播放上下文 = 心动列表），直接绑全局播放状态渲染。
// 与全屏播放页的差异（按需求）：不显示底部工具栏；⋯ 移到评论旁；无返回栏；左右滑切歌走心动流
export default memo(() => {
  const musicInfo = usePlayerMusicInfo()
  const morePopupRef = useRef<MorePopupType>(null)
  const [pagerHeight, setPagerHeight] = useState(0)
  const [belowCoverHeight, setBelowCoverHeight] = useState(0)
  const [coverSize, setCoverSize] = useState(0)
  const [showLyric, setShowLyric] = useState(false)

  const showFullLyric = useCallback(() => { setShowLyric(true) }, [])
  const hideFullLyric = useCallback(() => { setShowLyric(false) }, [])

  // 看歌词页时保持屏幕常亮（与全屏播放页一致）
  useEffect(() => {
    if (showLyric) screenkeepAwake()
    else screenUnkeepAwake()
  }, [showLyric])
  useEffect(() => () => { screenUnkeepAwake() }, [])

  // 页面常驻不卸载：切去其他 Tab 时回到封面页，屏幕常亮跟着取消
  const navActiveId = useNavActiveId()
  useEffect(() => {
    if (navActiveId != 'nav_ai') setShowLyric(false)
  }, [navActiveId])

  // 真正切歌（滑动跟手/按钮动画完成后由容器回调）：前进 = 随机推新（回退过则顺序恢复）、后退 = 本次会话历史。
  // 统一走心动模块（跳过全局「播放顺序」和稍后播放列表，保证心动流纯净）
  const handleSwipeNext = useCallback(() => {
    void (async() => {
      const info = await getAiRadioNext()
      if (info) await playAiRadioMusic(info.musicInfo)
    })()
  }, [])
  const handleSwipePrev = useCallback(() => {
    const info = getAiRadioPrev()
    if (info) void playAiRadioMusic(info.musicInfo)
  }, [])

  // 按钮点击上一首/下一首：走同款滑动动画（视觉与手势滑动连续）
  const swipeRef = useRef<SwipeSongContainerType>(null)
  const handleTriggerNext = useCallback(() => { swipeRef.current?.triggerSwipe(1) }, [])
  const handleTriggerPrev = useCallback(() => { swipeRef.current?.triggerSwipe(-1) }, [])

  const fetchNext = useCallback(async() => {
    const info = await getAiRadioNext()
    return toPreviewMusicInfo(info?.musicInfo)
  }, [])
  const fetchPrev = useCallback(() => {
    return toPreviewMusicInfo(getAiRadioPrev()?.musicInfo)
  }, [])

  // 上下滑看歌词：封面页支持「上滑跟手」（PageSlider 拖动轨道）；回封面用点击（歌词列表要能正常滚动）
  const canDrag = !showLyric
  const handleDragSettled = useCallback(() => {
    setShowLyric(true)
  }, [])

  const handleShowMore = useCallback(() => { morePopupRef.current?.show() }, [])
  const handleComment = useCallback(() => {
    navigations.pushCommentScreen(commonState.componentIds.home!)
  }, [])

  return (
    <View style={styles.page}>
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
                pagerHeight={pagerHeight}
                belowCoverHeight={belowCoverHeight}
                onPress={showFullLyric}
                onCoverSize={setCoverSize}
              />
              <View onLayout={({ nativeEvent }) => { setBelowCoverHeight(nativeEvent.layout.height) }}>
                <LyricInline onPress={showFullLyric} />
                <SongInfo showMore onMore={handleShowMore} onComment={handleComment} />
              </View>
            </View>
            <View style={styles.lyricPage}>
              <Lyric onPress={hideFullLyric} />
            </View>
          </PageSlider>
        </SwipeSongContainer>
        {/* 心动流永远随机推歌：不显示「播放顺序」切换键，也不需要队列入口；上一首/下一首走滑动动画 */}
        <Player overrides={{ hidePlayMode: true, hideQueue: true, onNext: handleTriggerNext, onPrev: handleTriggerPrev }} />
      </View>
      <MorePopup ref={morePopupRef} />
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
