import { useCallback, useEffect } from 'react'
import Header from './Header'
import Main from './Main'
import SubPage from './SubPage'
import SubPageHeader from './SubPageHeader'
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

  // Tab 页渲染 PagerView，子页面渲染页面本体（返回栏见下方，搜索页除外）
  let content
  if (isTab) {
    content = <Main />
  } else {
    content = (
      <>
        {/* 搜索页自带「取消」、设置页自带两级返回栏、歌单详情页自带头部，都不需要通用返回栏 */}
        {id == 'nav_search' || id == 'nav_setting' || id == 'nav_songlist_detail' ? null : <SubPageHeader id={id} />}
        <SubPage id={id} />
      </>
    )
  }

  return (
    <>
      <Header />
      {content}
    </>
  )
}

export default Content
