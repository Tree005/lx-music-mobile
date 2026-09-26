import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ComponentType } from 'react'
import { View } from 'react-native'
import PagerView, { type PageScrollStateChangedNativeEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import Home from '../Views/Home'
import AIHelper from '../Views/AIHelper'
import Mine from '../Views/Mine'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { setNavActiveId } from '@/core/common'
import settingState from '@/store/setting/state'
import { BOTTOM_TABS, TAB_OF_ID, type NAV_TAB_Type } from '@/config/constant'

// 底部三个 Tab 对应的页面组件
const PAGE_COMPONENTS: Record<NAV_TAB_Type, ComponentType> = {
  nav_home: Home,
  nav_ai: AIHelper,
  nav_mine: Mine,
}

// 索引映射由 BOTTOM_TABS 单源派生，避免手写导致顺序错位
const PAGE_IDS = BOTTOM_TABS.map(tab => tab.id) as readonly NAV_TAB_Type[]
const viewMap = Object.fromEntries(PAGE_IDS.map((id, index) => [id, index])) as Record<NAV_TAB_Type, number>

// 懒挂载：仅当前 Tab 页挂载，滑动到时再挂载
const LazyPage = ({ id, Component }: { id: NAV_TAB_Type, Component: ComponentType }) => {
  const [visible, setVisible] = useState(commonState.navActiveId == id)
  useEffect(() => {
    const handleNavIdUpdate = (navId: CommonState['navActiveId']) => {
      if (navId != id) return
      requestAnimationFrame(() => {
        setVisible(true)
      })
    }
    global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
    }
  }, [id])

  return visible ? <Component /> : null
}

const Main = () => {
  const pagerViewRef = useRef<ComponentRef<typeof PagerView>>(null)
  // 始终定位到当前 nav 所属 Tab 的索引
  const activeIndexRef = useRef(viewMap[TAB_OF_ID[commonState.navActiveId]])

  const onPageSelected = useCallback(({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    activeIndexRef.current = nativeEvent.position
    const tabId = PAGE_IDS[nativeEvent.position]
    if (tabId != undefined && tabId != TAB_OF_ID[commonState.navActiveId]) {
      setNavActiveId(tabId)
    }
  }, [])

  const onPageScrollStateChanged = useCallback(({ nativeEvent }: PageScrollStateChangedNativeEvent) => {
    const idle = nativeEvent.pageScrollState == 'idle'
    if (global.lx.homePagerIdle != idle) global.lx.homePagerIdle = idle
  }, [])

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      const index = viewMap[TAB_OF_ID[id]]
      if (index == undefined || activeIndexRef.current == index) return
      activeIndexRef.current = index
      pagerViewRef.current?.setPageWithoutAnimation(index)
    }
    const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
      if (!keys.includes('common.homePageScroll')) return
      pagerViewRef.current?.setScrollEnabled(setting['common.homePageScroll']!)
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    global.state_event.on('configUpdated', handleConfigUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
      global.state_event.off('configUpdated', handleConfigUpdate)
    }
  }, [])


  const component = useMemo(() => (
    <PagerView ref={pagerViewRef}
      initialPage={activeIndexRef.current}
      offscreenPageLimit={1}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      scrollEnabled={settingState.setting['common.homePageScroll']}
      style={styles.pagerView}
    >
      {
        BOTTOM_TABS.map(tab => (
          <View collapsable={false} key={tab.id} style={styles.pageStyle}>
            <LazyPage id={tab.id} Component={PAGE_COMPONENTS[tab.id]} />
          </View>
        ))
      }
    </PagerView>
  ), [onPageScrollStateChanged, onPageSelected])

  return component
}

const styles = createStyle({
  pagerView: {
    flex: 1,
    overflow: 'hidden',
  },
  pageStyle: {
    // alignItems: 'center',
    // padding: 20,
  },
})


export default Main
