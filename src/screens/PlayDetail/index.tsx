import { useCallback, useEffect } from 'react'
// import { View, StyleSheet } from 'react-native'
import { useHorizontalMode } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear, useNavigationComponentWillAppear } from '@/navigation/hooks'
import { setEdgeToEdge } from '@/utils/nativeModules/utils'

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 播放页要铺满到屏幕最底部：内容延伸到系统栏后面
  // （RNN 应用页面 options 时会把窗口设回非沉浸，willAppear/didAppear 都补一遍；
  //   导航栏透明色由页面 options 自带，不要再 mergeOptions——它反而会触发一次 options 应用把沉浸覆盖掉）
  const applyPlayDetailWindowStyle = useCallback(() => {
    setEdgeToEdge(true)
  }, [])
  useNavigationComponentWillAppear(componentId, applyPlayDetailWindowStyle)
  useNavigationComponentDidAppear(componentId, applyPlayDetailWindowStyle)
  useEffect(() => {
    applyPlayDetailWindowStyle()
    // 沉浸式现在是全应用行为（见 Home/index.tsx），离开播放页不需要还原
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
