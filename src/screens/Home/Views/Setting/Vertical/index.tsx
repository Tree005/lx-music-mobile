import { useCallback, useRef, useState } from 'react'

import Main, { type MainType, type SettingScreenIds } from '../Main'
import Home from './Home'
import NavList from './NavList'

// 竖屏设置页：两级结构
// - 主页：几个入口（数据同步 / 应用设置 / 自定义源 / 关于 / 更新 / 缓存）
// - 应用设置子页：顶部分区导航 + 分区内容
export default () => {
  const mainRef = useRef<MainType>(null)
  const [page, setPage] = useState<'home' | 'app'>('home')

  const openScreen = useCallback((id: SettingScreenIds) => {
    global.lx.settingActiveId = id
    setPage('app')
    mainRef.current?.setActiveId(id)
  }, [])

  const openAppSettings = useCallback(() => {
    setPage('app')
  }, [])

  if (page == 'home') {
    return <Home onOpenScreen={openScreen} onOpenAppSettings={openAppSettings} />
  }

  return (
    <>
      <NavList onChangeId={id => mainRef.current?.setActiveId(id)} />
      <Main ref={mainRef} />
    </>
  )
}
