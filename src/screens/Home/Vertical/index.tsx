import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { BOTTOM_TABS, LIST_IDS, type NAV_ID_Type } from '@/config/constant'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'
import { useNavigationBarHeight } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId } from '@/store/common/hook'
import { usePlayInfo, usePlayerMusicInfo } from '@/store/player/hook'
import { useAiRadioSession } from '@/core/aiRadio/hook'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import Background from '@/screens/PlayDetail/components/Background'
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

  // 心动页：封面模糊背景铺满整屏（含透明底栏后面），整个页面融入封面色调
  const navActiveId = useNavActiveId()
  const playInfo = usePlayInfo()
  const musicInfo = usePlayerMusicInfo()
  const aiSession = useAiRadioSession()
  const snapshotPic = useMusicPic(aiSession.snapshot?.musicInfo)
  const isHeartbeat = navActiveId == 'nav_ai'
  const isAiRadioActive = playInfo.playerListId == LIST_IDS.AI_RADIO
  const heartbeatBgVisible = isHeartbeat && (isAiRadioActive || !!aiSession.snapshot)
  const heartbeatPic = isAiRadioActive ? musicInfo.pic : (snapshotPic ?? null)

  const handleNavIdChange = useCallback((id: NAV_ID_Type) => {
    const isTab = BOTTOM_TABS.some(tab => tab.id === id)
    setTabBarVisible(isTab)
    // 心动页本身就是播放器页面，隐藏迷你播放条；其余 Tab 页 + 白名单子页面保留
    setPlayerBarVisible((isTab && id != 'nav_ai') || PLAYER_BAR_VISIBLE_SUB_PAGES[id] == true)
  }, [])

  return (
    <>
      {/* 心动页的封面模糊背景：铺满整屏、垫在内容与透明底栏之下（其他页面不渲染） */}
      {heartbeatBgVisible
        ? (
            <View style={styles.heartbeatBackdrop}>
              <Background pic={heartbeatPic} />
            </View>
          )
        : null}
      {/* 播放条悬浮在内容之上（不再独占一行）：内容可以滑到条的后面，
          条的上下（3dp）与左右（10dp）外边距处能看到内容；
          需要滚动到底的页面统一预留了 PLAYER_BAR_SPACE 的底部空间 */}
      <View style={styles.content}>
        <Content onNavIdChange={handleNavIdChange} />
        {playerBarVisible
          ? (
            <View style={styles.playerBarLayer} pointerEvents="box-none">
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
  heartbeatBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
