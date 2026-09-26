import Search from '../Views/Search'
import SongList from '../Views/SongList'
import Leaderboard from '../Views/Leaderboard'
import Mylist from '../Views/Mylist'
import Setting from '../Views/Setting'
import Download from '../Views/Download'
import History from '../Views/History'
import SonglistDetail from '../Views/Mylist/SonglistDetail'
import { type NAV_ID_Type } from '@/config/constant'

// 底部 Tab 之外的子页面：由首页 / 我的页的入口进入，切换时重建
const SubPage = ({ id }: { id: NAV_ID_Type }) => {
  switch (id) {
    case 'nav_search':
      return <Search />
    case 'nav_songlist':
      return <SongList />
    case 'nav_top':
      return <Leaderboard />
    case 'nav_love':
      return <Mylist />
    case 'nav_download':
      return <Download />
    case 'nav_history':
      return <History />
    case 'nav_songlist_detail':
      return <SonglistDetail />
    case 'nav_setting':
      return <Setting />
    default:
      return null
  }
}

export default SubPage
