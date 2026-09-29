import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Animated, View } from 'react-native'
import Main from './Main'
import SubPage from './SubPage'
import SubPageHeader from './SubPageHeader'
import useSlideTransition from '@/components/transitions/useSlideTransition'
import { SLIDE_PARALLAX_RATIO, SLIDE_SCRIM_OPACITY } from '@/components/transitions/constants'
import { BOTTOM_TABS, type NAV_ID_Type } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import { useWindowSize } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'

/**
 * 竖屏导航栈：给 Tab / 子页面切换加 iOS 式横滑转场（新页滑入、旧页视差左移并轻微变暗）。
 *
 * 设计：角色化双页 —— 每段转场只描述 { from, to, dir } 三个信息 + 一个 0→1 的 progress，
 * 各层按自己的「角色」把 progress 映射成位移/蒙层：
 * - Main 层永远在最底：idle（0）/ rest（恒停视差位）/ from（被推走）/ to（滑回来）
 * - 子页面层：from（旧页滑出）/ to（新页滑入）/ settled（已落定，恒 0）
 * 打断策略：settle-then-retarget —— 转场中目标又变时，先把在途转场立即结算（不等动画播完），
 * 以结算出的目标页为新的 from 再开启下一段转场。
 *
 * 蒙层约定（重要）：蒙层不能在同一棵 Animated.View 上把 opacity 从「native 动画值」切回
 * 静态数字——实测静态值不生效、蒙层会残留为不透明把整页盖黑。所以转场中用 Animated 蒙层、
 * 静止态用普通 View 渲染，让改变发生在「不同 View 实例」之间。
 */
const isTab = (v: NAV_ID_Type) => BOTTOM_TABS.some(tab => tab.id === v)

// 导航深度：tab = 0，tab 下的一级子页 = 1，歌单详情（从歌单再进一层）= 2
const NAV_DEPTH: Record<NAV_ID_Type, number> = {
  nav_home: 0,
  nav_ai: 0,
  nav_mine: 0,
  nav_search: 1,
  nav_songlist: 1,
  nav_top: 1,
  nav_love: 1,
  nav_download: 1,
  nav_history: 1,
  nav_setting: 1,
  nav_songlist_detail: 2,
}
const getDepth = (v: NAV_ID_Type) => NAV_DEPTH[v]

type SlideDir = 'forward' | 'backward'

// 方向判定：回 Tab / 回更浅的子页 = backward，其余（进子页、同级跳转）= forward
const getDir = (from: NAV_ID_Type | null, to: NAV_ID_Type): SlideDir => {
  if (isTab(to) && (from === null || !isTab(from))) return 'backward'
  if (from !== null && !isTab(from) && !isTab(to) && getDepth(to) < getDepth(from)) return 'backward'
  return 'forward'
}

interface NavStackState {
  /** 转场起点页；null = 已结算（不在转场中） */
  from: NAV_ID_Type | null
  /** 转场目标页（已结算时就是当前栈顶页） */
  to: NAV_ID_Type
}

interface NavStackProps {
  /** 当前 nav id（来自全局 navActiveId） */
  id: NAV_ID_Type
}

const NavStack = ({ id }: NavStackProps) => {
  const { width } = useWindowSize()
  const { progress, start, settle } = useSlideTransition()

  // 初值直接落定到当前页：启动/重挂载不播动画
  const [state, setState] = useState<NavStackState>({ from: null, to: id })
  const stateRef = useRef(state)
  // 已结算页 id：转场结束后它就是栈顶；用它而不是 state.from 判定「当前稳定在哪一页」
  const settledRef = useRef(id)
  // 转场在途时用户点过的 Tab：等转场自然收口后再补记栈顶（见下方 effect）
  const pendingTabRef = useRef<NAV_ID_Type | null>(null)

  const updateState = useCallback((next: NavStackState) => {
    stateRef.current = next
    setState(next)
  }, [])

  // 转场落定：先记新的栈顶、再收回 from 层，最后才复位 progress ——
  // 顺序颠倒会让 from 层在「仍可见」的一帧里闪回原位
  const finish = useCallback(() => {
    const { from, to } = stateRef.current
    if (from === null) return
    // 在途期间用户切了 Tab（内容已由 Main 直切到位）：栈顶补记为那个 Tab
    const pending = pendingTabRef.current
    pendingTabRef.current = null
    const next = pending ?? to
    settledRef.current = next
    updateState({ from: null, to: next })
    progress.setValue(0)
  }, [progress, updateState])

  useEffect(() => {
    if (stateRef.current.from !== null) {
      // 返回转场在途 + 用户点了别的 Tab（转场中底栏是唯一可点的 UI）：
      // 不打断动画 —— 立即 settle 会把 Main 从「位移中途值」一步切成静态值（可见跳变/露底）。
      // 内容已由 Main 直切、底栏也已高亮新 Tab，这里只登记目标，等动画自然收口后由 finish 补记
      if (isTab(id) && isTab(stateRef.current.to)) {
        pendingTabRef.current = id
        return
      }
      // 其他打断：先立即结算（settle 里会停掉动画并让 token 失效），
      // 把结算出的目标页作为下一段转场的 from
      settle(finish)
    }
    // 已稳定在目标页（含重复事件）→ 不需要新转场
    if (id === settledRef.current) return
    // Tab 之间的切换由 Main 自己管（display 显隐），不进转场
    if (isTab(settledRef.current) && isTab(id)) {
      settledRef.current = id
      return
    }
    updateState({ from: settledRef.current, to: id })
  }, [id, settle, finish, updateState])

  // 转场状态提交后、绘制前启动动画：保证出现的第一帧就已经是「起始位移」，
  // 而不是先闪一帧旧位置再跳过去
  useLayoutEffect(() => {
    if (state.from === null) return
    start(finish)
  }, [state, start, finish])

  const inTransition = state.from !== null
  const dir: SlideDir = getDir(state.from, state.to)
  const parallax = -width * SLIDE_PARALLAX_RATIO

  // Main 层角色：稳定态看栈顶是不是 tab；转场中看它在被推走还是滑回来
  let mainRole: 'idle' | 'rest' | 'from' | 'to'
  if (state.from === null) {
    mainRole = isTab(state.to) ? 'idle' : 'rest'
  } else if (isTab(state.from)) {
    mainRole = 'from'
  } else if (isTab(state.to)) {
    mainRole = 'to'
  } else {
    mainRole = 'rest'
  }

  // Main 的位移：idle/rest 用静态值，from/to 用 progress 插值
  let mainTranslateX: number | Animated.AnimatedInterpolation<number>
  // Main 的蒙层透明度：只在 from/to（转场中）用动画值，其余状态由 JSX 分支换成普通 View
  let mainScrimOpacity: number | Animated.AnimatedInterpolation<number> = 0
  switch (mainRole) {
    case 'from':
      // 从 tab 进子页，Main 被推走
      mainTranslateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, parallax] })
      mainScrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, SLIDE_SCRIM_OPACITY] })
      break
    case 'to':
      // 从子页回 tab，Main 滑回来
      mainTranslateX = progress.interpolate({ inputRange: [0, 1], outputRange: [parallax, 0] })
      mainScrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [SLIDE_SCRIM_OPACITY, 0] })
      break
    case 'rest':
      // 子页间切换/栈顶是子页，Main 保持视差位不动
      mainTranslateX = parallax
      break
    default:
      // idle：栈顶是 tab，Main 在原位
      mainTranslateX = 0
      break
  }

  // 子页面层：转场中 from 在下、to 在上；已结算时只剩栈顶（settled）
  const layers: Array<{ id: NAV_ID_Type, role: 'from' | 'to' | 'settled' }> = []
  if (state.from !== null && !isTab(state.from)) {
    layers.push({ id: state.from, role: 'from' })
  }
  if (!isTab(state.to)) {
    layers.push({ id: state.to, role: state.from === null ? 'settled' : 'to' })
  }

  return (
    <View style={styles.container}>
      {/* Main 层（底部 Tab 容器）：永远最底，转场中被推走/滑回/停在视差位 */}
      <Animated.View
        style={[styles.fill, { transform: [{ translateX: mainTranslateX }] }]}
        pointerEvents={inTransition ? 'none' : (isTab(state.to) ? 'auto' : 'none')}
      >
        <Main />
        {/* 变暗蒙层：转场中用 Animated 渐变；静止在视差位时换成普通 View 恒暗（idle 不渲染） */}
        {mainRole === 'rest'
          ? <View pointerEvents="none" style={[styles.scrim, { opacity: SLIDE_SCRIM_OPACITY }]} />
          : mainRole === 'idle'
            ? null
            : <Animated.View pointerEvents="none" style={[styles.scrim, { opacity: mainScrimOpacity }]} />}
      </Animated.View>
      {/* 子页面层：用同一个 keyed 数组渲染（而不是 from/to 两处独立条件渲染）——
          from 与 to 之间复用 key=v 的实例，旧页从 settled 迁移到 from 角色时不会被重建闪一下 */}
      {layers.map(layer => (
        <PageLayer
          key={layer.id}
          id={layer.id}
          role={layer.role}
          dir={dir}
          progress={progress}
          width={width}
        />
      ))}
    </View>
  )
}

interface PageLayerProps {
  id: NAV_ID_Type
  role: 'from' | 'to' | 'settled'
  dir: SlideDir
  progress: Animated.Value
  width: number
}

// 单个子页面层：铺满 + 自己的背景色（子页容器自身没有背景，不加会两层互相透视）
const PageLayer = ({ id, role, dir, progress, width }: PageLayerProps) => {
  const theme = useTheme()
  const parallax = -width * SLIDE_PARALLAX_RATIO

  // settled：恒在原位（progress 已被复位为 0，不能再按动画映射读）
  let translateX: number | Animated.AnimatedInterpolation<number> = 0
  let scrimOpacity: number | Animated.AnimatedInterpolation<number> = 0
  if (role === 'from') {
    // 旧页：前进时滑到视差位（露在下面），后退时向右滑出屏幕
    translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: dir === 'forward' ? [0, parallax] : [0, width],
    })
    scrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, SLIDE_SCRIM_OPACITY] })
  } else if (role === 'to') {
    // 新页：前进时从屏幕右侧滑入，后退时从视差位滑回
    translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: dir === 'forward' ? [width, 0] : [parallax, 0],
    })
    scrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [SLIDE_SCRIM_OPACITY, 0] })
  }

  return (
    <Animated.View
      style={[styles.fill, { backgroundColor: theme['c-content-background'] }, { transform: [{ translateX }] }]}
      pointerEvents={role === 'settled' ? 'auto' : 'none'}
    >
      {/* 搜索页自带「取消」、设置页自带两级返回栏、歌单详情页自带头部，都不需要通用返回栏 */}
      {id == 'nav_search' || id == 'nav_setting' || id == 'nav_songlist_detail' ? null : <SubPageHeader id={id} />}
      <SubPage id={id} />
      {/* 蒙层：只在转场中需要（settled 时本该是 0，直接不渲染，也避开动画值切静态的问题） */}
      {role === 'settled'
        ? null
        : <Animated.View pointerEvents="none" style={[styles.scrim, { opacity: scrimOpacity }]} />}
    </Animated.View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
})

export default NavStack
