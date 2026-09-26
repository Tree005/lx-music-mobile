import { useCallback, useEffect } from 'react'
import Header from './Header'
import Main from './Main'
import SubPage from './SubPage'
import SubPageHeader from './SubPageHeader'
import { BOTTOM_TABS, TAB_OF_ID } from '@/config/constant'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import { useBackHandler } from '@/utils/hooks/useBackHandler'

interface ContentProps {
  /** 当前 nav 是否为底部 Tab 页本身（供父组件控制播放条/底栏的显隐） */
  onIsTabChange?: (isTab: boolean) => void
}

const Content = ({ onIsTabChange }: ContentProps) => {
  const id = useNavActiveId()
  // 当前是底部 Tab 页本身，还是 Tab 下的子页面
  const isTab = BOTTOM_TABS.some(tab => tab.id === id)

  // 子页面下按返回键回退到所属的 Tab
  useBackHandler(useCallback(() => {
    if (isTab) return false
    setNavActiveId(TAB_OF_ID[id])
    return true
  }, [id, isTab]))

  // 向父组件上报「是否 Tab 页」，用于控制播放条/底栏显隐
  useEffect(() => {
    onIsTabChange?.(isTab)
  }, [isTab, onIsTabChange])

  // Tab 页渲染 PagerView，子页面渲染页面本体（返回栏见下方，搜索页除外）
  let content
  if (isTab) {
    content = <Main />
  } else {
    content = (
      <>
        {/* 搜索页自带「取消」按钮，不再需要返回栏；其他子页面保留返回栏 */}
        {id == 'nav_search' ? null : <SubPageHeader id={id} />}
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
