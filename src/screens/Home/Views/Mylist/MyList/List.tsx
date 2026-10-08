import { memo, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList, type NativeScrollEvent, type NativeSyntheticEvent, type FlatListProps } from 'react-native'

import { X } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { PLAYER_BAR_SPACE } from '@/components/player/PlayerBar'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useMyList } from '@/store/list/hook'
import { createStyle } from '@/utils/tools'
import { LIST_IDS, LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import { getListPosition, saveListPosition } from '@/utils/data'
import { getListMusics } from '@/core/list'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { useSonglistOnlineInfo } from '@/utils/hooks/useSonglistOnlineInfo'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { BorderWidths } from '@/theme'
import { PRESS_OPACITY } from '@/theme/motion'

type FlatListType = FlatListProps<LX.List.UserListInfo>

const ITEM_HEIGHT = scaleSizeH(88)

const ListItem = memo(({ item, onPress, onRemove }: {
  onPress: (item: LX.List.UserListInfo) => void
  onRemove: (item: LX.List.UserListInfo) => void
  item: LX.List.UserListInfo
}) => {
  const t = useI18n()
  const theme = useTheme()
  // 封面：收藏/导入的歌单用源歌单自己的封面，自建歌单用里面第一首歌的封面（没有就交给 Image 的占位图）
  const [firstMusic, setFirstMusic] = useState<LX.Music.MusicInfo | undefined>()
  const [musicCount, setMusicCount] = useState<number | null>(null)
  const onlineInfo = useSonglistOnlineInfo(item)
  const firstSongPic = useMusicPic(onlineInfo?.img ? undefined : firstMusic)
  const picUrl = onlineInfo?.img ?? firstSongPic

  useEffect(() => {
    let isUnmounted = false
    const load = () => {
      void getListMusics(item.id).then(musics => {
        if (isUnmounted) return
        setFirstMusic(musics[0])
        setMusicCount(musics.length)
      })
    }
    load()
    // 歌单是先建出来、再往里塞歌曲的（导入/收藏），歌曲变了要刷新封面与数量
    const handleChange = (ids: string[]) => {
      if (!ids.includes(item.id)) return
      load()
    }
    global.app_event.on('myListMusicUpdate', handleChange)
    return () => {
      isUnmounted = true
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [item.id])

  const source = item.source
    ? t(`source_alias_${item.source}`)
    : t('songlist_type_user')

  return (
    <TouchableOpacity
      style={{ ...styles.listItem, borderBottomColor: theme['c-border-background'] }}
      activeOpacity={PRESS_OPACITY}
      onPress={() => { onPress(item) }}
    >
      <Image style={styles.pic} url={picUrl} />
      <View style={styles.info}>
        <Text style={styles.name} size={16} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.desc} size={13} numberOfLines={1} color={theme['c-font-label']}>
          {musicCount == null ? source : `${source} · ${t('songlist_music_count', { count: musicCount })}`}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => { onRemove(item) }}>
        <PhIcon Icon={X} size={20} color={theme['c-font-label']} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item && prevProps.item.name == nextProps.item.name)
})


export default ({ onOpenList, onRemove }: {
  /** 点歌单：打开歌单详情页 */
  onOpenList: (item: LX.List.UserListInfo) => void
  /** 点 ✕：删除歌单 */
  onRemove: (item: LX.List.UserListInfo) => void
}) => {
  const flatListRef = useRef<FlatList>(null)
  const allList = useMyList()
  // 只显示歌单：收藏 / 导入的、以及自建的，试听列表与我的收藏是内置列表，不列出来
  const list = allList.filter(item => item.id !== LIST_IDS.DEFAULT && item.id !== LIST_IDS.LOVE) as LX.List.UserListInfo[]

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    void saveListPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }

  useEffect(() => {
    void getListPosition(LIST_SCROLL_POSITION_KEY).then((offset) => {
      flatListRef.current?.scrollToOffset({ offset, animated: false })
    })
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item }) => (
    <ListItem
      key={item.id}
      item={item}
      onPress={onOpenList}
      onRemove={onRemove}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      showsVerticalScrollIndicator={false}
      style={styles.container}
      // 播放条悬浮在内容上，底部预留条的高度（否则最后一项会被挡住）
      contentContainerStyle={{ paddingBottom: PLAYER_BAR_SPACE }}
      data={list}
      maxToRenderPerBatch={9}
      windowSize={9}
      removeClippedSubviews={true}
      initialNumToRender={18}
      renderItem={renderItem}
      keyExtractor={getkey}
      getItemLayout={getItemLayout}
    />
  )
}


const styles = createStyle({
  container: {
    flexShrink: 1,
    flexGrow: 0,
  },
  listItem: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 10,
    borderBottomWidth: BorderWidths.normal,
  },
  pic: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: 6,
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 14,
    paddingRight: 10,
  },
  name: {
    fontWeight: 'bold',
  },
  desc: {
    marginTop: 6,
  },
  removeBtn: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
