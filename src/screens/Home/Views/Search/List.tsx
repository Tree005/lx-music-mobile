import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { InitState as SearchState } from '@/store/search/state'
import type { Source as MusicSource } from '@/store/search/music/state'
import type { Source as SongListSource } from '@/store/search/songlist/state'
import MusicList, { type MusicListType } from './MusicList'
import BlankView from './BlankView'
import SonglistList from './SonglistList'

interface ListProps {
  source: LX.OnlineSource | 'all'
  onSearch: (keyword: string) => void
}
export interface ListType {
  loadList: (text: string, source: MusicSource | SongListSource, type: SearchState['searchType']) => void
}

export default forwardRef<ListType, ListProps>(({ source, onSearch }, ref) => {
  const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [showBlankView, setShowListView] = useState(true)
  const listRef = useRef<MusicListType>(null)

  useImperativeHandle(ref, () => ({
    loadList(text, source, type) {
      if (text) {
        setShowListView(false)
        setListType(type)
        // const listDetailInfo = searchMusicState.listDetailInfo
        requestAnimationFrame(() => {
          listRef.current?.loadList(text, source)
        })
      } else {
        // 空态：重新挂载 BlankView（组件挂载时自取数据），数据加载不再靠 ref 触发
        setShowListView(true)
      }
    },
  }), [])

  return (
    showBlankView
      ? <BlankView source={source} onSearch={onSearch} />
      : listType == 'songlist'
        ? <SonglistList ref={listRef} />
        : <MusicList ref={listRef} />
  )
})
