import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, TouchableOpacity, View } from 'react-native'
import { ListDashes, Prohibit, Repeat, RepeatOnce, Shuffle, Trash } from 'phosphor-react-native'
import Modal, { type ModalType } from '@/components/common/Modal'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useWindowSize } from '@/utils/hooks'
import { usePlayInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { getListMusicSync } from '@/utils/listManage'
import { playList } from '@/core/player/player'
import { clearListMusics, removeListMusics, updateListMusicPosition } from '@/core/list'
import { updateSetting } from '@/core/common'
import { MUSIC_TOGGLE_MODE, MUSIC_TOGGLE_MODE_LIST } from '@/config/constant'
import QueueItem, { ITEM_HEIGHT } from './QueueItem'

const styles = createStyle({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    flexGrow: 0,
    flexShrink: 1,
    width: '100%',
    maxHeight: '78%',
    elevation: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(8),
  },
  tab: {
    // 两个 tab 靠左紧挨排列（参考网易云），不居中、不等宽
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(12),
  },
  tabInner: {
    alignItems: 'center',
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(10),
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: scaleSizeH(2.5),
    borderRadius: 2,
  },
  headerSpace: {
    flexGrow: 1,
    flexShrink: 1,
  },
  headerBtn: {
    width: scaleSizeW(34),
    height: scaleSizeW(34),
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  empty: {
    height: ITEM_HEIGHT * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export interface PlayQueuePopupProps {
  visible: boolean
  onClose: () => void
}

type TabId = 'current' | 'history'

// 播放顺序切换按钮：与竖屏播放器控制行同一套轮换逻辑（列表循环/随机/顺序/单曲循环/单曲）
const PlayModeBtn = () => {
  const theme = useTheme()
  const t = useI18n()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')

  const icon = useMemo(() => {
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop:
        return Repeat
      case MUSIC_TOGGLE_MODE.random:
        return Shuffle
      case MUSIC_TOGGLE_MODE.list:
        return ListDashes
      case MUSIC_TOGGLE_MODE.singleLoop:
        return RepeatOnce
      default:
        return Prohibit
    }
  }, [togglePlayMethod])

  const handleToggle = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    let modeName: 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop:
        modeName = 'play_list_loop'
        break
      case MUSIC_TOGGLE_MODE.random:
        modeName = 'play_list_random'
        break
      case MUSIC_TOGGLE_MODE.list:
        modeName = 'play_list_order'
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
        modeName = 'play_single_loop'
        break
      default:
        modeName = 'play_single'
        break
    }
    toast(t(modeName))
  }

  return (
    <TouchableOpacity style={styles.headerBtn} activeOpacity={0.6} onPress={handleToggle}>
      <PhIcon Icon={icon} size={20} color={theme['c-font']} />
    </TouchableOpacity>
  )
}

export default memo(({ visible, onClose }: PlayQueuePopupProps) => {
  const theme = useTheme()
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const confirmRef = useRef<ConfirmAlertType>(null)
  const playInfo = usePlayInfo()
  const windowSize = useWindowSize()

  const [tab, setTab] = useState<TabId>('current')
  const [list, setList] = useState<LX.Music.MusicInfo[]>([])
  // 拖拽状态：dragIndex 为被拖行下标，targetIndex 为预计落点，dragAnim 驱动被拖行跟随手指
  const [dragIndex, setDragIndex] = useState(-1)
  const [targetIndex, setTargetIndex] = useState(-1)
  const dragAnim = useRef(new Animated.Value(0)).current
  const dragIndexRef = useRef(-1)
  const targetIndexRef = useRef(-1)

  const listId = playInfo.playerListId

  // 外部 visible 属性同步给 ref 控制的 Modal；每次打开重置 tab 与上次的拖拽残留状态
  useEffect(() => {
    modalRef.current?.setVisible(visible)
    if (!visible) return
    setTab('current')
    dragIndexRef.current = -1
    targetIndexRef.current = -1
    setDragIndex(-1)
    setTargetIndex(-1)
    dragAnim.setValue(0)
  }, [visible, dragAnim])

  // 弹层打开期间读取队列并监听列表变更（删除、排序、播放器切歌都会经 myListMusicUpdate 通知）
  useEffect(() => {
    if (!visible) return
    setList([...getListMusicSync(listId)])
    const handleListChange = (ids: string[]) => {
      if (listId == null || !ids.includes(listId)) return
      setList([...getListMusicSync(listId)])
    }
    global.app_event.on('myListMusicUpdate', handleListChange)
    return () => {
      global.app_event.off('myListMusicUpdate', handleListChange)
    }
  }, [visible, listId])

  const handlePlay = useCallback((index: number) => {
    if (listId == null) return
    if (index != playInfo.playerPlayIndex) void playList(listId, index)
    onClose()
  }, [listId, playInfo.playerPlayIndex, onClose])

  const handleRemove = useCallback((index: number) => {
    const item = list[index]
    if (!item || listId == null) return
    void removeListMusics(listId, [item.id])
  }, [list, listId])

  // 清空当前播放队列（走 core/list，会落盘并广播给播放器重算）
  const handleClear = useCallback(() => {
    confirmRef.current?.setVisible(true)
  }, [])

  const handleClearConfirm = useCallback(() => {
    if (listId == null) return
    void clearListMusics([listId])
  }, [listId])

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index
    targetIndexRef.current = index
    setDragIndex(index)
    setTargetIndex(index)
    dragAnim.setValue(0)
  }, [dragAnim])

  const handleDragMove = useCallback((dy: number) => {
    const from = dragIndexRef.current
    if (from < 0) return
    // 位移限制在列表首尾之间，拖出边界时停住
    const clampedDy = Math.min(Math.max(dy, -from * ITEM_HEIGHT), (list.length - 1 - from) * ITEM_HEIGHT)
    dragAnim.setValue(clampedDy)
    // 跨过行高的一半即认为落点变化
    const to = from + Math.round(clampedDy / ITEM_HEIGHT)
    if (to != targetIndexRef.current) {
      targetIndexRef.current = to
      setTargetIndex(to)
    }
  }, [dragAnim, list.length])

  const handleDragEnd = useCallback(() => {
    const from = dragIndexRef.current
    const to = targetIndexRef.current
    dragIndexRef.current = -1
    targetIndexRef.current = -1
    setDragIndex(-1)
    setTargetIndex(-1)
    dragAnim.setValue(0)

    if (from < 0 || to < 0 || from == to || listId == null) return
    const musicId = list[from]?.id
    if (!musicId) return

    // 先按结果更新本地顺序（省去等待异步落盘时闪回旧顺序），再提交到播放列表
    setList((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    void updateListMusicPosition(listId, to, [musicId])
  }, [dragAnim, list, listId])

  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfo, index: number }) => (
    <QueueItem
      item={item}
      index={index}
      active={index == playInfo.playerPlayIndex}
      dragIndex={dragIndex}
      targetIndex={targetIndex}
      dragAnim={dragAnim}
      onPress={handlePlay}
      onRemove={handleRemove}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    />
  ), [dragAnim, dragIndex, targetIndex, handlePlay, handleRemove, handleDragStart, handleDragMove, handleDragEnd, playInfo.playerPlayIndex])

  const renderTab = (id: TabId, label: string) => {
    const active = tab == id
    return (
      <TouchableOpacity style={styles.tab} activeOpacity={0.7} onPress={() => { setTab(id) }}>
        <View style={styles.tabInner}>
          <Text size={16} color={active ? theme['c-font'] : theme['c-font-label']} style={active ? styles.tabTextActive : null}>{label}</Text>
          {active ? <View style={[styles.tabIndicator, { backgroundColor: theme['c-font'] }]} /> : null}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Modal ref={modalRef} onHide={onClose} bgColor="rgba(50,50,50,.2)">
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: theme['c-content-background'] }]} onStartShouldSetResponder={() => true}>
            <View style={styles.tabBar}>
              {renderTab('current', t('play_queue_current'))}
              {renderTab('history', t('play_queue_history'))}
              <View style={styles.headerSpace} />
              {
                // 队列操作只在「当前播放」tab 显示，避免在历史页误清空
                tab == 'current'
                  ? (
                      <>
                        <PlayModeBtn />
                        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.6} onPress={handleClear}>
                          <PhIcon Icon={Trash} size={20} color={theme['c-font']} />
                        </TouchableOpacity>
                      </>
                    )
                  : null
              }
            </View>
            {
              tab == 'history'
                ? <View style={styles.empty}>
                    <Text size={14} color={theme['c-font-label']}>{t('play_queue_history_empty')}</Text>
                  </View>
                : list.length
                  ? <FlatList
                      style={[styles.list, { maxHeight: windowSize.height * 0.7 }]}
                      showsVerticalScrollIndicator={false}
                      data={list}
                      keyExtractor={(item, index) => `${item.id}_${index}`}
                      renderItem={renderItem}
                      extraData={dragIndex}
                      scrollEnabled={dragIndex < 0}
                      getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    />
                  : <View style={styles.empty}>
                      <Text size={14} color={theme['c-font-label']}>{t('no_item')}</Text>
                    </View>
            }
          </View>
        </View>
      </Modal>
      <ConfirmAlert
        ref={confirmRef}
        title={t('play_queue_clear_title')}
        text={t('play_queue_clear_tip')}
        cancelText={t('cancel')}
        confirmText={t('confirm')}
        onConfirm={handleClearConfirm}
      />
    </>
  )
})
