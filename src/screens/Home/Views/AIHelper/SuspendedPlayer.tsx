import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { type Line } from '@/plugins/lyric'

import SwipeSongContainer, { toPreviewMusicInfo, type SwipeSongContainerType } from '@/screens/PlayDetail/components/SwipeSongContainer'
import PageSlider from '@/screens/PlayDetail/components/PageSlider'
import Pic, { COVER_BOTTOM_MARGIN } from '@/screens/PlayDetail/Vertical/Pic'
import Lyric from '@/screens/PlayDetail/Vertical/Lyric'
import LyricInline from '@/screens/PlayDetail/Vertical/LyricInline'
import SongInfo from '@/screens/PlayDetail/Vertical/SongInfo'
import Player from '@/screens/PlayDetail/Vertical/Player'
import MorePopup, { type MorePopupType } from '@/screens/PlayDetail/Vertical/components/MorePopup'
import { getAiRadioNext, getAiRadioPrev, playAiRadioMusic, resumeSession, type AiRadioSnapshot } from '@/core/aiRadio'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { formatPlayTime2 } from '@/utils'
import { useNavActiveId } from '@/store/common/hook'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'
import { createStyle } from '@/utils/tools'

// 心动页 · 挂起态：心动流的上下文被普通播放切走了（或暂停没在响），
// 显示快照歌的「暂停态」——封面 / 歌名 / 静态进度 / 独立解析的歌词；点播放或滑动即接管播放
export default memo(({ snapshot, lyricLines }: {
  snapshot: AiRadioSnapshot
  lyricLines: Line[]
}) => {
  const morePopupRef = useRef<MorePopupType>(null)
  const [pagerHeight, setPagerHeight] = useState(0)
  const [belowCoverHeight, setBelowCoverHeight] = useState(0)
  const [coverSize, setCoverSize] = useState(0)
  const [showLyric, setShowLyric] = useState(false)
  const pic = useMusicPic(snapshot.musicInfo)

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

  // 恢复播放：从快照歌 + 上次的进度继续（心动流接管）
  const handleResume = useCallback(() => {
    void resumeSession()
  }, [])

  // 真正切歌（滑动跟手/按钮动画完成后由容器回调）
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
    // 挂起态评论的是「快照歌」（此刻全局播放的不是它）
    navigations.pushCommentScreen(commonState.componentIds.home!, snapshot.musicInfo)
  }, [snapshot.musicInfo])

  // 底部控制区的数据 / 行为覆盖：进度 = 快照的静态值；播放 = 恢复；
  // 上 / 下一首走滑动动画；心动流永远随机推歌：不显示「播放顺序」切换键
  const playerOverrides = useMemo(() => ({
    progress: {
      nowPlayTime: snapshot.time,
      maxPlayTime: snapshot.maxTime,
      nowPlayTimeStr: formatPlayTime2(snapshot.time),
      maxPlayTimeStr: formatPlayTime2(snapshot.maxTime),
      progress: snapshot.maxTime > 0 ? snapshot.time / snapshot.maxTime : 0,
    },
    isPlay: false,
    disableSeek: true,
    onTogglePlay: handleResume,
    onPrev: handleTriggerPrev,
    onNext: handleTriggerNext,
    hidePlayMode: true,
    hideQueue: true,
  }), [snapshot, handleResume, handleTriggerPrev, handleTriggerNext])

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <SwipeSongContainer
          ref={swipeRef}
          currentKey={snapshot.musicInfo.id}
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
                picOverride={pic || null}
                pagerHeight={pagerHeight}
                belowCoverHeight={belowCoverHeight}
                onPress={showFullLyric}
                onCoverSize={setCoverSize}
              />
              <View onLayout={({ nativeEvent }) => { setBelowCoverHeight(nativeEvent.layout.height) }}>
                <LyricInline lines={lyricLines} line={0} onPress={showFullLyric} />
                <SongInfo musicInfoOverride={snapshot.musicInfo} showMore onMore={handleShowMore} onComment={handleComment} />
              </View>
            </View>
            <View style={styles.lyricPage}>
              <Lyric lines={lyricLines} line={0} onPress={hideFullLyric} />
            </View>
          </PageSlider>
        </SwipeSongContainer>
        <Player overrides={playerOverrides} />
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
