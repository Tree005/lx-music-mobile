import { useCallback, useEffect, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import MusicList from './MusicList'
import MyList from './MyList'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import SonglistImport, { type SonglistImportType } from './SonglistImport'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'
import { scaleSizeH } from '@/utils/pixelRatio'
import { setActiveList } from '@/core/list'
import { setNavActiveId } from '@/core/common'
import { LIST_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import { SLIDE_DURATION_STACK } from '@/components/transitions/constants'

const TABS = ['music', 'list'] as const
type TabType = typeof TABS[number]

// 我的收藏：单曲 / 歌单 双 tab（等宽两列，对齐参考图）
// - 独立页面（nav_love）与「我的」页内嵌都用它
// - 单曲 = 我的收藏的歌，歌单 = 收藏/导入/自建的歌单列表
export default ({ embedded, active = true }: { embedded?: boolean, active?: boolean }) => {
  const t = useI18n()
  const theme = useTheme()
  const [tab, setTab] = useState<TabType>('music')
  const listNameEditRef = useRef<ListNameEditType>(null)
  const songlistImportRef = useRef<SonglistImportType>(null)

  const handleChange = useCallback((next: TabType) => {
    setTab(next)
  }, [])

  const handleCreate = useCallback((position: number) => {
    listNameEditRef.current?.showCreate(position)
  }, [])
  const handleImport = useCallback(() => {
    songlistImportRef.current?.show()
  }, [])
  // 点歌单：打开歌单详情子页面（详情里的歌曲列表复用「单曲」那套，所以先把当前列表切成它）
  const handleOpenList = useCallback((item: LX.List.UserListInfo) => {
    setActiveList(item.id)
    global.lx.songlistDetailListId = item.id
    setNavActiveId('nav_songlist_detail')
  }, [])

  // 内嵌在「我的」页时，「单曲」tab 固定展示我的收藏（列表本身已用 listId 钉死 LOVE）：
  // 全局「当前列表」会被别处切走（如在别处播放某个歌单），这里在回到「我的」页时把它钉回收藏。
  // 注意：
  // - 不活跃时（active=false，如已进歌单详情页）完全不注册监听——否则隐藏的监听会把
  //   详情页刚切好的列表抢回 LOVE，导致详情页显示错误内容
  // - 钉住延迟到转场结束后再做——歌单详情页的歌曲列表会实时跟随当前列表变化（它监听
  //   mylistToggled），返回时详情页还在滑出，立即钉会把它的内容换掉
  useEffect(() => {
    if (!active || !embedded || tab != 'music') return
    const pinTimer = setTimeout(() => {
      // 竞态兜底：回调到期时可能已离开「我的」页（如刚点进歌单详情，clearTimeout 对已入队的回调无效）
      if (commonState.navActiveId != 'nav_mine') return
      setActiveList(LIST_IDS.LOVE)
    }, SLIDE_DURATION_STACK + 60)
    // 监听回调带 id：LOVE 自身触发的不再回调，避免 setActiveList 自触发循环
    const handleListToggle = (id: string) => {
      if (id == LIST_IDS.LOVE) return
      // 已离开「我的」页时（如点击歌单进详情页）不要抢回；事件是 setImmediate 异步派发，
      // 读到的一定是最新的 nav id
      if (commonState.navActiveId != 'nav_mine') return
      setActiveList(LIST_IDS.LOVE)
    }
    global.state_event.on('mylistToggled', handleListToggle)
    return () => {
      clearTimeout(pinTimer)
      global.state_event.off('mylistToggled', handleListToggle)
    }
  }, [active, embedded, tab])

  return (
    <View style={styles.container}>
      {
        embedded
          ? <Text style={styles.sectionTitle} size={17}>{t('list_name_love')}</Text>
          : null
      }
      <View style={{ ...styles.tabBar, borderBottomColor: theme['c-border-background'] }}>
        {
          TABS.map(id => (
            <TouchableOpacity key={id} style={styles.tabItem} onPress={() => { handleChange(id) }}>
              <Text
                size={16}
                color={tab == id ? theme['c-primary-font-active'] : theme['c-font-label']}
                style={{
                  ...styles.tabText,
                  borderBottomColor: tab == id ? theme['c-primary-background-active'] : 'transparent',
                }}
              >{t(`mylist_tab_${id}`)}</Text>
            </TouchableOpacity>
          ))
        }
      </View>
      <View style={styles.content}>
        {
          tab == 'music'
            // detailMode：带封面 + 红心（点击取消收藏），与歌单详情页行样式一致
            // listId：钉死收藏列表，不受全局「当前列表」切换影响
            ? <MusicList embedded={embedded} ignoreJump={embedded} detailMode listId={LIST_IDS.LOVE} />
            : <MyList onOpenList={handleOpenList} onCreate={handleCreate} onImport={handleImport} />
        }
      </View>
      <ListNameEdit ref={listNameEditRef} />
      <SonglistImport ref={songlistImportRef} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  // 内嵌时「我的收藏」标题行（标题右上方原来有两个入口图标，按参考图去掉了）
  sectionTitle: {
    fontWeight: 'bold',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 14,
    paddingBottom: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: BorderWidths.normal,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    paddingTop: 8,
    paddingBottom: scaleSizeH(8),
    borderBottomWidth: BorderWidths.normal3,
  },
  content: {
    flex: 1,
  },
})
