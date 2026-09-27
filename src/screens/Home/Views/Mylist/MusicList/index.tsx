import { useCallback, useRef } from 'react'

import listState from '@/store/list/state'
import settingState from '@/store/setting/state'
import { addListMusics, removeListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import ListMenu, { type ListMenuType, type Position, type SelectInfo } from './ListMenu'
import { clearMusicUrl, handleDislikeMusic, handlePlay, handlePlayLater, handleRemove, handleShare, handleShowMusicSourceDetail, handleUpdateMusicInfo, handleUpdateMusicPosition } from './listAction'
import List, { type ListType } from './List'
import ListMusicAdd, { type MusicAddModalType as ListMusicAddType } from '@/components/MusicAddModal'
import ListMusicMultiAdd, { type MusicMultiAddModalType as ListAddMultiType } from '@/components/MusicMultiAddModal'
import { createStyle } from '@/utils/tools'
import { type LayoutChangeEvent, View } from 'react-native'
import ActiveList, { type ActiveListType } from './ActiveList'
import MultipleModeBar, { type SelectMode, type MultipleModeBarType } from './MultipleModeBar'
import ListSearchBar, { type ListSearchBarType } from './ListSearchBar'
import ListMusicSearch, { type ListMusicSearchType } from './ListMusicSearch'
import MusicPositionModal, { type MusicPositionModalType } from './MusicPositionModal'
import MetadataEditModal, { type MetadataEditType, type MetadataEditProps } from '@/components/MetadataEditModal'
import MusicToggleModal, { type MusicToggleModalType } from './MusicToggleModal'
import { scaleSizeH } from '@/utils/pixelRatio'


export default ({ embedded, detailMode = false, canRemoveMusic = false, ignoreJump = false, listId }: {
  embedded?: boolean
  /** 歌单详情页样式：行带封面、收藏与移除按钮 */
  detailMode?: boolean
  /** 详情页里是否允许把歌从歌单里移除（只有自建歌单可以） */
  canRemoveMusic?: boolean
  /** 忽略「跳转到正在播放歌曲所在列表」的待处理标记（内嵌在固定列表的页面里用） */
  ignoreJump?: boolean
  /** 固定展示的列表 id（如收藏页钉住 LOVE）：不读「上次列表」、不跟随全局列表切换 */
  listId?: string
}) => {
  // const t = useI18n()
  const activeListRef = useRef<ActiveListType>(null)
  const listMusicSearchRef = useRef<ListMusicSearchType>(null)
  const listRef = useRef<ListType>(null)
  const multipleModeBarRef = useRef<MultipleModeBarType>(null)
  const listSearchBarRef = useRef<ListSearchBarType>(null)
  const listMusicAddRef = useRef<ListMusicAddType>(null)
  const listMusicMultiAddRef = useRef<ListAddMultiType>(null)
  const musicPositionModalRef = useRef<MusicPositionModalType>(null)
  const metadataEditTypeRef = useRef<MetadataEditType>(null)
  const listMenuRef = useRef<ListMenuType>(null)
  const musicToggleModalRef = useRef<MusicToggleModalType>(null)
  const layoutHeightRef = useRef<number>(0)
  const isShowMultipleModeBar = useRef(false)
  const isShowSearchBarModeBar = useRef(false)
  const selectedInfoRef = useRef<SelectInfo>()
  // console.log('render index list')

  const hancelMultiSelect = useCallback(() => {
    if (isShowSearchBarModeBar.current) {
      multipleModeBarRef.current?.setVisibleBar(false)
    } else activeListRef.current?.setVisibleBar(false)
    isShowMultipleModeBar.current = true
    multipleModeBarRef.current?.show()
    listRef.current?.setIsMultiSelectMode(true)
  }, [])
  const hancelExitSelect = useCallback(() => {
    if (isShowSearchBarModeBar.current) {
      multipleModeBarRef.current?.setVisibleBar(true)
    } else activeListRef.current?.setVisibleBar(true)
    // console.log('hancelExitSelect', isShowSearchBarModeBar.current)
    multipleModeBarRef.current?.exitSelectMode()
    listRef.current?.setIsMultiSelectMode(false)
    isShowMultipleModeBar.current = false
  }, [])
  const hancelSwitchSelectMode = useCallback((mode: SelectMode) => {
    multipleModeBarRef.current?.setSwitchMode(mode)
    listRef.current?.setSelectMode(mode)
  }, [])
  const hancelScrollToTop = useCallback(() => {
    listRef.current?.scrollToTop()
  }, [])

  const showMenu = useCallback((musicInfo: LX.Music.MusicInfo, index: number, position: Position) => {
    listMenuRef.current?.show({
      musicInfo,
      index,
      listId: listId ?? listState.activeListId,
      single: false,
      selectedList: listRef.current!.getSelectedList(),
    }, position)
  }, [listId])
  const handleShowSearch = useCallback(() => {
    isShowSearchBarModeBar.current = true
    if (isShowMultipleModeBar.current) {
      multipleModeBarRef.current?.setVisibleBar(false)
    } else activeListRef.current?.setVisibleBar(false)
    listSearchBarRef.current?.show()
  }, [])
  const handleExitSearch = useCallback(() => {
    isShowSearchBarModeBar.current = false
    listMusicSearchRef.current?.hide()
    listSearchBarRef.current?.hide()
    // console.log('handleExitSearch', isShowMultipleModeBar.current)
    if (isShowMultipleModeBar.current) {
      multipleModeBarRef.current?.setVisibleBar(true)
    } else activeListRef.current?.setVisibleBar(true)
  }, [])
  const handleScrollToInfo = useCallback((info: LX.Music.MusicInfo) => {
    listRef.current?.scrollToInfo(info)
    handleExitSearch()
  }, [handleExitSearch])
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }, [])

  const handleRemoveMusic = useCallback((musicInfo: LX.Music.MusicInfo) => {
    void removeListMusics(listId ?? listState.activeListId, [musicInfo.id])
  }, [listId])
  const handleToggleLove = useCallback((musicInfo: LX.Music.MusicInfo, isLoved: boolean) => {
    if (isLoved) void removeListMusics(LIST_IDS.LOVE, [musicInfo.id])
    else void addListMusics(LIST_IDS.LOVE, [musicInfo], settingState.setting['list.addMusicLocationType'])
  }, [])

  const handleAddMusic = useCallback((info: SelectInfo) => {
    if (info.selectedList.length) {
      listMusicMultiAddRef.current?.show({ selectedList: info.selectedList, listId: info.listId, isMove: false })
    } else {
      listMusicAddRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId, isMove: false })
    }
  }, [])
  const handleMoveMusic = useCallback((info: SelectInfo) => {
    if (info.selectedList.length) {
      listMusicMultiAddRef.current?.show({ selectedList: info.selectedList, listId: info.listId, isMove: true })
    } else {
      listMusicAddRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId, isMove: true })
    }
  }, [])
  const handleEditMetadata = useCallback((info: SelectInfo) => {
    if (info.musicInfo.source != 'local') return
    selectedInfoRef.current = info
    metadataEditTypeRef.current?.show(info.musicInfo.meta.filePath)
  }, [])
  const handleUpdateMetadata = useCallback<MetadataEditProps['onUpdate']>((info) => {
    if (!selectedInfoRef.current || selectedInfoRef.current.musicInfo.source != 'local') return
    handleUpdateMusicInfo(selectedInfoRef.current.listId, selectedInfoRef.current.musicInfo, info)
  }, [])


  // 多选条在两种布局里都渲染（它自己是绝对定位的），只是挂的位置不同
  const multipleModeBar = (
    <MultipleModeBar
      ref={multipleModeBarRef}
      onSwitchMode={hancelSwitchSelectMode}
      onSelectAll={isAll => listRef.current?.selectAll(isAll)}
      onExitSelectMode={hancelExitSelect}
    />
  )

  return (
    <View style={styles.container}>
      {
        // 内嵌在「我的」页时没有「当前列表」条（列表固定是收藏），多选条改成浮在列表顶部
        embedded
          ? null
          : (
              <View style={{ zIndex: 2 }}>
                <ActiveList ref={activeListRef} onShowSearchBar={handleShowSearch} onScrollToTop={hancelScrollToTop} />
                {multipleModeBar}
                <ListSearchBar
                  ref={listSearchBarRef}
                  onSearch={keyword => listMusicSearchRef.current?.search(keyword, layoutHeightRef.current)}
                  onExitSearch={handleExitSearch}
                />
              </View>
            )
      }
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <List
          ref={listRef}
          onShowMenu={showMenu}
          onMuiltSelectMode={hancelMultiSelect}
          onSelectAll={isAll => multipleModeBarRef.current?.setIsSelectAll(isAll)}
          showPic={detailMode}
          showRemove={detailMode && canRemoveMusic}
          onRemoveItem={handleRemoveMusic}
          onToggleLove={handleToggleLove}
          ignoreJump={ignoreJump}
          listId={listId}
        />
        <ListMusicSearch
          ref={listMusicSearchRef}
          onScrollToInfo={handleScrollToInfo}
        />
        {/* 多选条浮层：box-none 让点击穿透到列表，否则会挡住第一首歌的点击区域 */}
        {embedded ? <View style={styles.embeddedModeBar} pointerEvents="box-none">{multipleModeBar}</View> : null}
      </View>
      <ListMusicAdd ref={listMusicAddRef} onAdded={hancelExitSelect} />
      <ListMusicMultiAdd ref={listMusicMultiAddRef} onAdded={hancelExitSelect} />
      <MusicPositionModal ref={musicPositionModalRef}
        onUpdatePosition={(info, postion) => { handleUpdateMusicPosition(postion, info.listId, info.musicInfo, info.selectedList, hancelExitSelect) }} />
      <ListMenu
        ref={listMenuRef}
        onPlay={info => { handlePlay(info.listId, info.index) }}
        onPlayLater={info => { hancelExitSelect(); handlePlayLater(info.listId, info.musicInfo, info.selectedList, hancelExitSelect) }}
        onRemove={info => { hancelExitSelect(); handleRemove(info.listId, info.musicInfo, info.selectedList, hancelExitSelect) }}
        onDislikeMusic={info => { void handleDislikeMusic(info.musicInfo) }}
        onCopyName={info => { handleShare(info.musicInfo) }}
        onMusicSourceDetail={info => { void handleShowMusicSourceDetail(info.musicInfo) }}
        onAdd={handleAddMusic}
        onMove={handleMoveMusic}
        onEditMetadata={handleEditMetadata}
        onChangePosition={info => musicPositionModalRef.current?.show(info)}
        onToggleSource={info => musicToggleModalRef.current?.show(info)}
        onRemoveCache={info => { void clearMusicUrl(info.musicInfo) }}
      />
      <MetadataEditModal
        ref={metadataEditTypeRef}
        onUpdate={handleUpdateMetadata}
      />
      <MusicToggleModal ref={musicToggleModalRef} />
    </View>
  )
}


const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  // 内嵌场景下多选条的容器：浮在列表顶部，高度与原来的「当前列表」条一致
  embeddedModeBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: scaleSizeH(36),
    zIndex: 2,
  },
})
