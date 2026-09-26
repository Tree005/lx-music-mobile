import { useCallback, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ArrowsDownUp, ListPlus } from 'phosphor-react-native'

import MusicList from './MusicList'
import MyList from './MyList'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import SonglistImport, { type SonglistImportType } from './SonglistImport'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { BorderWidths } from '@/theme'
import { scaleSizeH } from '@/utils/pixelRatio'
import listState from '@/store/list/state'

const TABS = ['music', 'list'] as const
type TabType = typeof TABS[number]

// 我的收藏：单曲 / 歌单 双 tab（等宽两列，对齐参考图）
// - 独立页面（nav_love）与「我的」页内嵌都用它
// - embedded 时由这里出「我的收藏」标题（右侧是新建歌单 / 导入外部歌单）
export default ({ embedded }: { embedded?: boolean }) => {
  const t = useI18n()
  const theme = useTheme()
  const [tab, setTab] = useState<TabType>('music')
  const listNameEditRef = useRef<ListNameEditType>(null)
  const songlistImportRef = useRef<SonglistImportType>(null)

  const handleChange = useCallback((next: TabType) => {
    setTab(next)
  }, [])

  // 新建 / 重命名 / 导入歌单都挂在这一层，歌单 tab 与标题行按钮共用
  const handleCreate = useCallback((position: number) => {
    listNameEditRef.current?.showCreate(position)
  }, [])
  const handleRename = useCallback((listInfo: LX.List.UserListInfo) => {
    listNameEditRef.current?.show(listInfo)
  }, [])
  const handleImport = useCallback(() => {
    songlistImportRef.current?.show()
  }, [])

  return (
    <View style={styles.container}>
      {
        embedded
          ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} size={17}>{t('list_name_love')}</Text>
                <TouchableOpacity style={styles.headerBtn} onPress={handleImport}>
                  <PhIcon Icon={ArrowsDownUp} size={20} color={theme['c-font']} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn} onPress={() => { handleCreate(listState.userList.length) }}>
                  <PhIcon Icon={ListPlus} size={22} color={theme['c-font']} />
                </TouchableOpacity>
              </View>
            )
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
        {/* 两个列表都是自包含组件，内部各自管理菜单、弹窗与多选状态 */}
        {
          tab == 'music'
            ? <MusicList embedded={embedded} />
            : <MyList onCreate={handleCreate} onRename={handleRename} onImport={handleImport} />
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
  // 内嵌时「我的收藏」标题行，右侧是新建歌单 / 导入外部歌单两个按钮
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 14,
  },
  sectionTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
