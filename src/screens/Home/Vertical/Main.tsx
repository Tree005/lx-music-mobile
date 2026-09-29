import { useEffect, useState, type ComponentType } from 'react'
import { View } from 'react-native'
import Home from '../Views/Home'
import AIHelper from '../Views/AIHelper'
import Mine from '../Views/Mine'
import commonState from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { useNavActiveId } from '@/store/common/hook'
import { BOTTOM_TABS, TAB_OF_ID, type NAV_TAB_Type } from '@/config/constant'

// 底部三个 Tab 对应的页面组件
const PAGE_COMPONENTS: Record<NAV_TAB_Type, ComponentType> = {
  nav_home: Home,
  nav_ai: AIHelper,
  nav_mine: Mine,
}

// 懒挂载：仅当前 Tab 页挂载，切到时再挂载（挂载后常驻，靠 display 控制显隐、保留页面状态）
const LazyPage = ({ id, Component, active }: { id: NAV_TAB_Type, Component: ComponentType, active: boolean }) => {
  const [mounted, setMounted] = useState(commonState.navActiveId == id)
  useEffect(() => {
    if (active && !mounted) setMounted(true)
  }, [active, mounted])
  return (mounted || active) ? <Component /> : null
}

/**
 * Tab 容器：只通过底部栏切换（左右滑动切 tab 已禁用，横滑手势让给页面内的切歌），
 * 所以不用 PagerView —— 它的原生触摸拦截会把页面里的左右滑手势打断（ViewPager2 实测：
 * 每次 JS claim 都被 terminate），用条件渲染 + display 显隐替代。
 *
 * Tab 之间点按直切、无转场动画；挂载过的 Tab 页常驻不卸载（保状态）。
 */
const Main = () => {
  const activeId = useNavActiveId()
  // 子页面期间 navActiveId 不是 Tab id —— 必须映射到所属 Tab，否则三页全隐藏
  const tabId = TAB_OF_ID[activeId]

  return (
    <View style={styles.container}>
      {BOTTOM_TABS.map(tab => (
        <View key={tab.id} style={tab.id === tabId ? styles.pageVisible : styles.pageHidden}>
          <LazyPage id={tab.id} Component={PAGE_COMPONENTS[tab.id]} active={tab.id === tabId} />
        </View>
      ))}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pageVisible: {
    flex: 1,
  },
  // 挂载过的 Tab 页保留状态（不卸载），用 display 隐藏
  pageHidden: {
    display: 'none',
  },
})

export default Main
