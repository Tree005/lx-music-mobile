import { useCallback, useState } from 'react'
import { BOTTOM_TABS, type NAV_ID_Type } from '@/config/constant'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'

// 播放条在这些子页面里保留显示（歌单详情页可以边听边看歌单）
const PLAYER_BAR_VISIBLE_SUB_PAGES: Partial<Record<NAV_ID_Type, true>> = {
  nav_songlist_detail: true,
}

export default () => {
  // 播放条/底栏显隐：由 Content（实测能收到 nav 变化的组件）上报当前页面
  // 底栏只在 Tab 页显示；播放条在 Tab 页 + 白名单子页面显示
  const [playerBarVisible, setPlayerBarVisible] = useState(true)
  const [tabBarVisible, setTabBarVisible] = useState(true)

  const handleNavIdChange = useCallback((id: NAV_ID_Type) => {
    const isTab = BOTTOM_TABS.some(tab => tab.id === id)
    setTabBarVisible(isTab)
    setPlayerBarVisible(isTab || PLAYER_BAR_VISIBLE_SUB_PAGES[id] == true)
  }, [])

  return (
    <>
      <Content onNavIdChange={handleNavIdChange} />
      {playerBarVisible ? <PlayerBar isHome /> : null}
      {tabBarVisible ? <TabBar /> : null}
    </>
  )
}
