import { useCallback, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import MusicList from './MusicList'
import MyList from './MyList'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'

const TABS = ['music', 'list'] as const
type TabType = typeof TABS[number]

// 我的收藏：单曲 / 歌单 双 tab（等宽两列，对齐参考图）
// - 独立页面（nav_love）与「我的」页内嵌都用它
// - embedded 时由外层出「我的收藏」标题，单曲列表也不显示「当前列表」条
export default ({ embedded }: { embedded?: boolean }) => {
  const t = useI18n()
  const theme = useTheme()
  const [tab, setTab] = useState<TabType>('music')

  const handleChange = useCallback((next: TabType) => {
    setTab(next)
  }, [])

  return (
    <View style={styles.container}>
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
        {tab == 'music' ? <MusicList embedded={embedded} /> : <MyList />}
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
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
    paddingBottom: 8,
    borderBottomWidth: BorderWidths.normal3,
  },
  content: {
    flex: 1,
  },
})
