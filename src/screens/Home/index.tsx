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
import { useSettingValue } from '@/store/setting/hook'
import { useNavigationComponentDidAppear, useNavigationComponentWillAppear } from '@/navigation/hooks'
import { setEdgeToEdge, setOrientationLock } from '@/utils/nativeModules/utils'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  const isEnableHorizontal = useSettingValue('common.isEnableHorizontal')

  // 「启用横屏」关闭时锁定竖屏方向（开启时恢复系统默认、跟随设备旋转）
  useEffect(() => {
    setOrientationLock(!isEnableHorizontal)
  }, [isEnableHorizontal])

  // 全应用沉浸式：窗口内容延伸到系统栏后面 + 系统导航栏透明
  // （RNN 在应用页面 options 时会重置窗口状态，所以出现播放页等页面返回时要重新设置；
  //   willAppear 在转场动画开始前触发，提前恢复可以避免动画期间"底部栏被系统顶起再落下"的抖动）
  const applyEdgeToEdgeWindowStyle = useCallback(() => {
    Navigation.mergeOptions(componentId, {
      navigationBar: {
        backgroundColor: 'transparent',
      },
    })
    setEdgeToEdge(true)
  }, [componentId])
  useNavigationComponentWillAppear(componentId, applyEdgeToEdgeWindowStyle)
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
