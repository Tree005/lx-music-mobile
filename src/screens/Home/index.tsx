import { useCallback, useEffect } from 'react'
import { AppState } from 'react-native'
import { Navigation } from 'react-native-navigation'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'
import { useNavigationComponentDidAppear, useNavigationComponentWillAppear } from '@/navigation/hooks'
import { setEdgeToEdge, setOrientationLock } from '@/utils/nativeModules/utils'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  // 全应用沉浸式：窗口内容延伸到系统栏后面 + 系统导航栏透明
  // ⚠️ RNN 应用页面 options（navigationBar.visible 默认 true）时会把窗口设回「非沉浸」，
  //    且 mergeOptions 本身也会触发一次 options 应用——所以这里只做 setEdgeToEdge，
  //    导航栏透明色由页面 options 自带（navigation.ts）
  const applyEdgeToEdgeWindowStyle = useCallback(() => {
    setEdgeToEdge(true)
  }, [])
  useNavigationComponentWillAppear(componentId, applyEdgeToEdgeWindowStyle)
  useNavigationComponentDidAppear(componentId, applyEdgeToEdgeWindowStyle)

  // 命令完成后补刀：RNN 每次应用 options 都会把窗口设回非沉浸（SystemUiUtils.showNavigationBar），
  // 启动阶段会连续应用多次（setRoot/页面挂载……），晚于手动恢复的调用会把沉浸式覆盖掉，
  // 导致「首次进播放页前」底部栏被系统顶起，要等一次导航之后才恢复。这里在每条命令结束时补一次。
  useEffect(() => {
    const listener = Navigation.events().registerCommandCompletedListener(() => {
      setEdgeToEdge(true)
    })
    return () => {
      listener.remove()
    }
  }, [])

  // 恒定锁定竖屏方向
  useEffect(() => {
    setOrientationLock(true)
    // setRequestedOrientation 会让系统重置窗口状态（edge-to-edge 失效、底部被顶起），随即恢复
    applyEdgeToEdgeWindowStyle()
  }, [applyEdgeToEdgeWindowStyle])

  // 兜底：回到前台时恢复窗口状态（后台期间系统/RNN 可能重置），避免退出播放页等场景底部栏被顶起
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state == 'active') applyEdgeToEdgeWindowStyle()
    })
    return () => {
      subscription.remove()
    }
  }, [applyEdgeToEdgeWindowStyle])

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
      <Vertical />
    </PageContent>
  )
}
