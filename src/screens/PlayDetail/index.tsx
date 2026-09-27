import { useCallback, useEffect } from 'react'
// import { View, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useHorizontalMode } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation/hooks'
import { setEdgeToEdge } from '@/utils/nativeModules/utils'
import commonState from '@/store/common/state'
import themeState from '@/store/theme/state'

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 播放页要铺满到屏幕最底部：导航栏透明 + 内容延伸到系统栏后面
  // （RNN 在应用页面 options 时会把窗口状态重置，所以每次页面出现都要重新设置一遍）
  const applyPlayDetailWindowStyle = useCallback(() => {
    Navigation.mergeOptions(componentId, {
      navigationBar: {
        backgroundColor: 'transparent',
      },
    })
    setEdgeToEdge(true)
  }, [componentId])
  useNavigationComponentDidAppear(componentId, applyPlayDetailWindowStyle)
  useEffect(() => {
    applyPlayDetailWindowStyle()
    return () => {
      setEdgeToEdge(false)
      // 恢复导航栏配色：导航栏在播放页被改成透明（浅色手势条），返回后要还原成主题色
      const homeId = commonState.componentIds.home
      if (homeId == null) return
      Navigation.mergeOptions(homeId, {
        navigationBar: {
          backgroundColor: themeState.theme['c-content-background'],
        },
      })
    }
  }, [applyPlayDetailWindowStyle])

  return (
    <PageContent>
      <StatusBar />
      {
        isHorizontalMode
          ? <Horizontal componentId={componentId} />
          : <Vertical componentId={componentId} />
      }
    </PageContent>
  )
}
