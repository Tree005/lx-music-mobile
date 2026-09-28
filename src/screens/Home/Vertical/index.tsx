import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { BOTTOM_TABS, type NAV_ID_Type } from '@/config/constant'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import PlayerBarBackdrop from '@/components/player/PlayerBar/Backdrop'
import TabBar from './TabBar'
import { useNavigationBarHeight } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

// 播放条在这些子页面里保留显示（歌单详情页可以边听边看歌单）
const PLAYER_BAR_VISIBLE_SUB_PAGES: Partial<Record<NAV_ID_Type, true>> = {
  nav_songlist_detail: true,
}

export default () => {
  // 播放条/底栏显隐：由 Content（实测能收到 nav 变化的组件）上报当前页面
  // 底栏只在 Tab 页显示；播放条在 Tab 页 + 白名单子页面显示
  const [playerBarVisible, setPlayerBarVisible] = useState(true)
  const [tabBarVisible, setTabBarVisible] = useState(true)
  const navigationBarHeight = useNavigationBarHeight()
  const theme = useTheme()

  const handleNavIdChange = useCallback((id: NAV_ID_Type) => {
    const isTab = BOTTOM_TABS.some(tab => tab.id === id)
    setTabBarVisible(isTab)
    setPlayerBarVisible(isTab || PLAYER_BAR_VISIBLE_SUB_PAGES[id] == true)
  }, [])

  return (
    <>
      {/* 播放条悬浮在内容之上（不再独占一行）：内容可以滑到条的后面，
          条的上下（3dp）与左右（10dp）外边距处能看到内容；
          需要滚动到底的页面统一预留了 PLAYER_BAR_SPACE 的底部空间 */}
      <View style={styles.content}>
        <Content onNavIdChange={handleNavIdChange} />
        {playerBarVisible
          ? (
            <View style={styles.playerBarLayer} pointerEvents="box-none">
              {/* 渐变遮罩：内容靠近条时渐隐到背景色（模仿网易云），条本身看不出「白底」边界 */}
              <PlayerBarBackdrop />
              <PlayerBar isHome />
            </View>
            )
          : null}
      </View>
      {tabBarVisible
        ? <TabBar />
        // 无底栏时（子页面）用背景色补上系统导航栏安全区，避免内容被手势条压住
        : <View style={{ height: navigationBarHeight, backgroundColor: theme['c-content-background'] }} />}
    </>
  )
}

const styles = createStyle({
  content: {
    flex: 1,
  },
  playerBarLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
})
