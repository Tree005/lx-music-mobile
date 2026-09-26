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

// 「我的收藏」：单曲 / 歌单 双 tab（原来是「主区单曲 + 侧边抽屉歌单」的布局）
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [tab, setTab] = useState<TabType>('music')

  const handleChange = useCallback((next: TabType) => {
    setTab(next)
    // MyList 依赖 changeLoveListVisible 事件才会挂载，切到歌单 tab 时补一次
    if (next == 'list') global.app_event.changeLoveListVisible(true)
  }, [])

  return (
    <View style={styles.container}>
      <View style={{ ...styles.tabBar, borderBottomColor: theme['c-border-background'] }}>
        {
          TABS.map(id => (
            <TouchableOpacity key={id} style={styles.tabItem} onPress={() => { handleChange(id) }}>
              <Text
                size={15}
                color={tab == id ? theme['c-primary-font-active'] : theme['c-font']}
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
        {tab == 'music' ? <MusicList /> : <MyList />}
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
    paddingLeft: 20,
    borderBottomWidth: BorderWidths.normal,
  },
  tabItem: {
    marginRight: 20,
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
