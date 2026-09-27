import { useCallback, useEffect } from 'react'
import { Navigation } from 'react-native-navigation'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'
import { useNavigationComponentDidAppear } from '@/navigation/hooks'
import { setEdgeToEdge } from '@/utils/nativeModules/utils'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()

  // 全应用沉浸式：窗口内容延伸到系统栏后面 + 系统导航栏透明
  // （RNN 在应用页面 options 时会重置窗口状态，所以每次页面出现都要重新设置一遍）
  const applyEdgeToEdgeWindowStyle = useCallback(() => {
    Navigation.mergeOptions(componentId, {
      navigationBar: {
        backgroundColor: 'transparent',
      },
    })
    setEdgeToEdge(true)
  }, [componentId])
  useNavigationComponentDidAppear(componentId, applyEdgeToEdgeWindowStyle)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    applyEdgeToEdgeWindowStyle()
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent>
      {
        isHorizontalMode
          ? <Horizontal />
          : <Vertical />
      }
    </PageContent>
  )
}
