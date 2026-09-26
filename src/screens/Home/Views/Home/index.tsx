import { ScrollView } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import SearchBar from './components/SearchBar'
import SonglistsSection from './components/SonglistsSection'
import HotSongsSection from './components/HotSongsSection'
import BoardsSection from './components/BoardsSection'

// 首页：顶部搜索框 + 推荐歌单（横滑大卡片）+ 热门歌曲（榜单歌曲列表）+ 排行榜
// 本页由 PagerView 懒挂载，异步数据请求与卸载保护都在子区块内各自处理
export default () => {
  const theme = useTheme()

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <SearchBar />
      <SonglistsSection />
      <HotSongsSection />
      <BoardsSection />
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    // 顶部留出搜索框与状态栏的间距，区块之间统一 22px
    paddingTop: 14,
    paddingBottom: 24,
    gap: 22,
  },
})
