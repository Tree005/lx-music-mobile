import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Animated, Easing, View } from 'react-native'
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
import { HEARTBEAT_RELEASE_DELAY } from '@/components/transitions/constants'

// 播放条在这些子页面里保留显示（歌单详情页可以边听边看歌单；搜索页搜歌/点榜单时也要能操作播放）
const PLAYER_BAR_VISIBLE_SUB_PAGES: Partial<Record<NAV_ID_Type, true>> = {
  nav_songlist_detail: true,
  nav_search: true,
}

// 播放条显隐动画：300ms 淡入淡出 + 从下方 24dp 滑入/滑出（进出统一）
const PLAYER_BAR_ANIM_DURATION = 300
const PLAYER_BAR_HIDDEN_TRANSLATE_Y = 24

export default () => {
  // 播放条/底栏显隐：由 Content（实测能收到 nav 变化的组件）上报当前页面
  // 底栏只在 Tab 页显示；播放条在 Tab 页 + 白名单子页面显示
  const [playerBarVisible, setPlayerBarVisible] = useState(true)
  const [tabBarVisible, setTabBarVisible] = useState(true)
  // 播放条带动画显隐：rendered 决定 layer 是否挂载，anim（0 隐藏 / 1 显示）驱动 opacity 与位移
  const [playerBarRendered, setPlayerBarRendered] = useState(true)
  // 播放条动画期间不给点击，完整显示后才恢复 box-none
  const [playerBarInteractive, setPlayerBarInteractive] = useState(true)
  const playerBarAnim = useRef(new Animated.Value(1)).current
  // 记录当前期望的显隐目标：快速来回切换时，旧动画的完成回调不能按过期目标卸载 layer
  const playerBarVisibleTargetRef = useRef(true)
  const isFirstPlayerBarEffectRef = useRef(true)
  const navigationBarHeight = useNavigationBarHeight()
  const theme = useTheme()

  // 心动页：封面模糊背景铺满整屏（含透明底栏后面），整个页面融入封面色调
  const navActiveId = useNavActiveId()
  const playInfo = usePlayInfo()
  const musicInfo = usePlayerMusicInfo()
  const aiSession = useAiRadioSession()
  const snapshotPic = useMusicPic(aiSession.snapshot?.musicInfo)
  // 心动页的透明态（模糊背景 + 透明底栏）释放策略，按离开的目标页型区分：
  // - 目标是底部 Tab（首页/我的）：Tab 之间是直切、无转场 → 立即释放。
  //   若延迟释放，残留的模糊背景会从「状态栏占位」与「透明底栏」两条缝里透出深色，
  //   表现为切页后上下各一条窄黑条一闪（真机复现过）
  // - 目标是子页面：有 150ms 横滑转场 → 延迟释放，防止心动页滑出期间失去背景白闪
  const [heartbeatUi, setHeartbeatUi] = useState(navActiveId == 'nav_ai')
  // 用 layout effect（绘制前执行）：离开心动去 Tab 的「立即释放」必须与目标页同帧生效，
  // 普通 effect 会晚一帧（JS 忙时跨帧），切页瞬间能从上下两条缝里透出残留深色
  useLayoutEffect(() => {
    if (navActiveId == 'nav_ai') {
      setHeartbeatUi(true)
      return
    }
    if (BOTTOM_TABS.some(tab => tab.id === navActiveId)) {
      setHeartbeatUi(false)
      return
    }
    // 延迟释放分支：当前导航图下不可达（nav_ai 仅 TabBar 出口，心动页内没有子页面入口），
    // 为将来给心动页加页面入口时保留（有 150ms 横滑转场时需要它防转场白闪）
    const timer = setTimeout(() => { setHeartbeatUi(false) }, HEARTBEAT_RELEASE_DELAY + 60)
    return () => { clearTimeout(timer) }
  }, [navActiveId])
  const isAiRadioActive = playInfo.playerListId == LIST_IDS.AI_RADIO
  // 暗底（模糊背景）是否可见；底栏透明态也跟随它——无暗底时保持正常底色，
  // 避免透明底栏上的白字落在浅色背景上不可读（EmptyState 场景用户报过）
  const heartbeatBgVisible = heartbeatUi && (isAiRadioActive || !!aiSession.snapshot)
  const heartbeatPic = isAiRadioActive ? musicInfo.pic : (snapshotPic ?? null)

  // 播放条进出动画：显示时挂载后再滑入（等挂载帧提交，否则看不到第一段位移）；
  // 隐藏时先滑出、完成后才卸载（带定时兜底）
  useEffect(() => {
    // 首次挂载不播动画（初值就是显示态）
    if (isFirstPlayerBarEffectRef.current) {
      isFirstPlayerBarEffectRef.current = false
      return
    }
    playerBarVisibleTargetRef.current = playerBarVisible
    // 隐藏动画的兜底定时器：native 动画完成回调实测有延迟，超时按完成处理
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    if (playerBarVisible) {
      setPlayerBarRendered(true)
      setPlayerBarInteractive(false)
      requestAnimationFrame(() => {
        // 这一帧前又切回隐藏的话，交给隐藏分支处理
        if (!playerBarVisibleTargetRef.current) return
        Animated.timing(playerBarAnim, {
          toValue: 1,
          duration: PLAYER_BAR_ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return
          if (playerBarVisibleTargetRef.current) setPlayerBarInteractive(true)
        })
      })
    } else {
      setPlayerBarInteractive(false)
      hideTimer = setTimeout(() => {
        // 超时时若已切回显示（目标 ref 防抖）则不卸载
        if (playerBarVisibleTargetRef.current) return
        setPlayerBarRendered(false)
      }, PLAYER_BAR_ANIM_DURATION + 80)
      Animated.timing(playerBarAnim, {
        toValue: 0,
        duration: PLAYER_BAR_ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return
        // 动画结束前又切回显示（新动画已接管）时不要卸载 layer
        if (playerBarVisibleTargetRef.current) return
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
        setPlayerBarRendered(false)
      })
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [playerBarVisible, playerBarAnim])

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
          条的上下（3dp）与左右（18dp）外边距处能看到内容；
          需要滚动到底的页面统一预留了 PLAYER_BAR_SPACE 的底部空间 */}
      <View style={styles.content}>
        <Content onNavIdChange={handleNavIdChange} />
        {playerBarRendered
          ? (
            <Animated.View
              style={[
                styles.playerBarLayer,
                {
                  opacity: playerBarAnim,
                  transform: [{
                    translateY: playerBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [PLAYER_BAR_HIDDEN_TRANSLATE_Y, 0],
                    }),
                  }],
                },
              ]}
              pointerEvents={playerBarInteractive ? 'box-none' : 'none'}
            >
              <PlayerBar isHome />
            </Animated.View>
            )
          : null}
      </View>
      {tabBarVisible
        // 底栏透明态跟随「暗底是否存在」（heartbeatBgVisible）：无暗底时保持正常底色可读
        ? <TabBar heartbeat={heartbeatBgVisible} />
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
