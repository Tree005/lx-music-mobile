import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'

export default () => {
  return (
    <>
      <Content />
      <PlayerBar isHome />
      <TabBar />
    </>
  )
}
