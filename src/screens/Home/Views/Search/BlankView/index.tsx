import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import HistorySearch from './HistorySearch'
import HotSearch from './HotSearch'
import RankList from './RankList'

type TabId = 'hot' | 'rank_hot' | 'rank_new'

interface BlankViewProps {
  source: LX.OnlineSource | 'all'
  onSearch: (keyword: string) => void
}

// 搜索空态：搜索历史（顶部一行）+ 三个 tab（热门搜索 / 热歌榜 / 新歌榜）
// 数据跟随传入的源（初始为主音源，搜索页选择器切换后本页生效）
// 数据加载由各内容组件在挂载/源变化时自取（不要改回父组件隔帧调 show() 的写法，会因 ref 未就绪静默不加载）
export default ({ source, onSearch }: BlankViewProps) => {
  const theme = useTheme()
  const t = useI18n()
  const [tab, setTab] = useState<TabId>('hot')
  // 懒挂载 + 常驻：访问过的 tab 不卸载（display 切换），切回不重新加载、不闪
  const [visited, setVisited] = useState<ReadonlySet<TabId>>(() => new Set<TabId>(['hot']))

  const handleTabChange = (id: TabId) => {
    setTab(id)
    if (!visited.has(id)) setVisited(new Set([...visited, id]))
  }

  const tabItems: Array<{ id: TabId, label: string }> = [
    { id: 'hot', label: t('search_hot_search') },
    { id: 'rank_hot', label: t('search_rank_hot') },
    { id: 'rank_new', label: t('search_rank_new') },
  ]

  return (
    <View style={styles.container}>
      <HistorySearch onSearch={onSearch} />
      <View style={styles.tabBar}>
        {
          tabItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => { handleTabChange(item.id) }}
            >
              <Text size={15} color={tab == item.id ? theme['c-primary'] : theme['c-font-label']} style={tab == item.id ? styles.tabLabelActive : null}>{item.label}</Text>
              { tab == item.id ? <View style={{ ...styles.tabLine, backgroundColor: theme['c-primary'] }} /> : null }
            </TouchableOpacity>
          ))
        }
      </View>
      <View style={styles.content}>
        <View style={[styles.page, tab != 'hot' ? styles.hidden : null]}>
          <HotSearch source={source} onSearch={onSearch} />
        </View>
        {
          visited.has('rank_hot')
            ? (
                <View style={[styles.page, tab != 'rank_hot' ? styles.hidden : null]}>
                  <RankList source={source} type="hot" />
                </View>
              )
            : null
        }
        {
          visited.has('rank_new')
            ? (
                <View style={[styles.page, tab != 'rank_new' ? styles.hidden : null]}>
                  <RankList source={source} type="new" />
                </View>
              )
            : null
        }
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
    alignItems: 'center',
    paddingLeft: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  tabItem: {
    paddingLeft: 12,
    paddingRight: 12,
    alignItems: 'center',
  },
  tabLabelActive: {
    fontWeight: 'bold',
  },
  tabLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
})
