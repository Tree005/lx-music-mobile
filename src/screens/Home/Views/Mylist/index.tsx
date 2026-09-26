import { useCallback, useRef, useState } from 'react'
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

const TABS = ['music', 'list'] as const
type TabType = typeof TABS[number]

// 我的收藏：单曲 / 歌单 双 tab（等宽两列，对齐参考图）
// - 独立页面（nav_love）与「我的」页内嵌都用它
// - 单曲 = 我的收藏的歌，歌单 = 收藏/导入/自建的歌单列表
export default ({ embedded }: { embedded?: boolean }) => {
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
            ? <MusicList embedded={embedded} />
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
