import { useCallback, useEffect } from 'react'
import Header from './Header'
import NavStack from './NavStack'
import { BOTTOM_TABS, TAB_OF_ID, type NAV_ID_Type } from '@/config/constant'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import { useBackHandler } from '@/utils/hooks/useBackHandler'

interface ContentProps {
  /** nav 变化时上报当前页面 id（供父组件控制播放条/底栏的显隐） */
  onNavIdChange?: (id: NAV_ID_Type) => void
}

const Content = ({ onNavIdChange }: ContentProps) => {
  const id = useNavActiveId()
  // 当前是底部 Tab 页本身，还是 Tab 下的子页面
  const isTab = BOTTOM_TABS.some(tab => tab.id === id)

  // 子页面下按返回键回退到所属的 Tab
  useBackHandler(useCallback(() => {
    if (isTab) return false
    // 设置页自带「主页 / 二级页」层级，交给它自己的返回处理
    if (id == 'nav_setting') return false
    setNavActiveId(TAB_OF_ID[id])
    return true
  }, [id, isTab]))

  // 向父组件上报当前页面，用于控制播放条/底栏显隐
  useEffect(() => {
    onNavIdChange?.(id)
  }, [id, onNavIdChange])

  // 页面组装（Main / SubPageHeader / SubPage）与横滑转场都在 NavStack 里
  return (
    <>
      <Header />
      <NavStack id={id} />
    </>
  )
}

export default Content
