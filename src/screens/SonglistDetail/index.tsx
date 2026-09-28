import { useEffect, useRef } from 'react'
import { View } from 'react-native'

import MusicList, { type MusicListType } from './MusicList'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { type ListInfoItem } from '@/store/songlist/state'
import PlayerBar, { PLAYER_BAR_SPACE } from '@/components/player/PlayerBar'
import { useNavigationBarHeight } from '@/utils/hooks'
import { ListInfoContext } from './state'


export default ({ componentId, info }: { componentId: string, info: ListInfoItem }) => {
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  const navigationBarHeight = useNavigationBarHeight()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.songlistDetail, componentId)

    isUnmountedRef.current = false

    musicListRef.current?.loadList(info.source, info.id)


    return () => {
      isUnmountedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  return (
    <PageContent>
      <StatusBar />
      <ListInfoContext.Provider value={info}>
        {/* 底部让出迷你播放条的高度：列表滚到底时最后一项不被播放条挡住 */}
        <View style={{ flex: 1, paddingBottom: PLAYER_BAR_SPACE }}>
          <MusicList ref={musicListRef} componentId={componentId} />
        </View>
      </ListInfoContext.Provider>
      <PlayerBar />
      {/* 沉浸式全屏：补上系统导航栏（手势条）的安全区，播放条不被手势条压住 */}
      <View style={{ height: navigationBarHeight }} />
    </PageContent>
  )
}

// const styles = createStyle({
//   container: {
//     width: '100%',
//     flex: 1,
//     flexDirection: 'row',
//     borderTopWidth: BorderWidths.normal,
//   },
//   content: {
//     flex: 1,
//   },
// })
