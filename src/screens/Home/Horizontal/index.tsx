import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'
import { useNavigationBarHeight } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default () => {
  const navigationBarHeight = useNavigationBarHeight()
  const theme = useTheme()

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          <PlayerBar isHome />
          {/* 沉浸式：播放条下方补系统导航栏安全区 */}
          {navigationBarHeight > 0
            ? <View style={{ height: navigationBarHeight, backgroundColor: theme['c-content-background'] }} />
            : null}
        </View>
      </View>
    </>
  )
}
