import { useCallback, useState } from 'react'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'

export default () => {
  // 是否隐藏播放条与底栏：由 Content（实测能收到 nav 变化的组件）上报
  // 目前规则：进入子页面（非 Tab 页）时隐藏
  const [hideBars, setHideBars] = useState(false)

  const handleIsTabChange = useCallback((isTab: boolean) => {
    setHideBars(!isTab)
  }, [])

  return (
    <>
      <Content onIsTabChange={handleIsTabChange} />
      {hideBars ? null : <PlayerBar isHome />}
      {hideBars ? null : <TabBar />}
    </>
  )
}
