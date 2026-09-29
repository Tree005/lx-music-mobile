import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { PlayCircle } from 'phosphor-react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { PhIcon } from '@/components/common/PhIcon'
import { getBoardsList, getListDetail } from '@/core/leaderboard'
import { useMainSource } from '@/core/mainSource'
import leaderboardState from '@/store/leaderboard/state'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'

// 榜单歌曲最多取 20 首
const MAX_HOT_SONG_NUM = 20
// 每页显示 3 首，左右滑动翻页
const PAGE_SIZE = 3

// 首页热门歌曲：落雪没有个性化推荐接口，用「热歌榜」的歌曲替代
export default () => {
  const theme = useTheme()
  const t = useI18n()
  const mainSource = useMainSource()
  const { width } = useWindowDimensions()
  const [list, setList] = useState<LX.Music.MusicInfoOnline[]>([])
  // 记录实际使用的榜单 id，播放时作为临时列表 id 的组成部分
  const [boardId, setBoardId] = useState('')
  const [status, setStatus] = useState<'loading' | 'idle' | 'empty'>('loading')
  const [page, setPage] = useState(0)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false

    const load = async() => {
      // 内置音源已清空、未导入自定义音源时，榜单数据拿不到，直接走空态
      if (!leaderboardState.sources.length) {
        setStatus('empty')
        return
      }
      try {
        const boards = await getBoardsList(mainSource)
        if (isUnmountedRef.current) return
        if (!boards?.length) {
          setStatus('empty')
          return
        }
        // 优先取名称含「热歌」的榜单，找不到就退回第一个
        const board = boards.find(b => b.name.includes('热歌')) ?? boards[0]
        const result = await getListDetail(board.id, 1)
        if (isUnmountedRef.current) return
        if (!result?.list?.length) {
          setStatus('empty')
          return
        }
        setBoardId(board.id)
        setList(result.list.slice(0, MAX_HOT_SONG_NUM))
        setStatus('idle')
      } catch (err) {
        // 请求异常同样降级为空态，保证不白屏、不抛错
        if (isUnmountedRef.current) return
        console.log('get hot songs failed:', err)
        setStatus('empty')
      }
    }
    void load()

    return () => {
      isUnmountedRef.current = true
    }
  }, [mainSource])

  // 按每页 3 首切分成若干页
  const pages = useMemo(() => {
    const result: LX.Music.MusicInfoOnline[][] = []
    for (let i = 0; i < list.length; i += PAGE_SIZE) {
      result.push(list.slice(i, i + PAGE_SIZE))
    }
    return result
  }, [list])

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width))
  }, [width])

  // 与 Leaderboard/listAction.ts 的 handlePlay 同模式：整列表设为临时列表，再播第 index 首
  const handlePlay = async(index: number) => {
    await setTempList(`home_hot__${boardId}`, [...list])
    void playList(LIST_IDS.TEMP, index)
  }

  return (
    <View>
      <View style={styles.header}>
        <Text size={18} style={styles.title}>{t('home_section_hot')}</Text>
        {/* 翻页指示点 */}
        {
          pages.length > 1
            ? (
                <View style={styles.dots}>
                  {
                    pages.map((_, index) => (
                      <View
                        key={index}
                        style={{
                          ...styles.dot,
                          backgroundColor: index == page ? theme['c-primary'] : theme['c-border-background'],
                        }}
                      />
                    ))
                  }
                </View>
              )
            : null
        }
      </View>
      {
        status == 'empty'
          ? (
              <Text style={styles.empty} size={13} color={theme['c-font-label']}>{t('no_item')}</Text>
            )
          : status == 'loading'
            ? null
            : (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScrollEnd}
                >
                  {
                    pages.map((pageItems, pageIndex) => (
                      <View key={pageIndex} style={{ width }}>
                        {
                          pageItems.map((item, i) => {
                            const index = pageIndex * PAGE_SIZE + i
                            return (
                              <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.7}
                                style={styles.row}
                                onPress={() => { void handlePlay(index) }}
                              >
                                <Image url={item.meta.picUrl} style={styles.cover} />
                                <View style={styles.info}>
                                  <Text size={15} numberOfLines={1} style={styles.name}>{item.name}</Text>
                                  <Text size={12} color={theme['c-font-label']} numberOfLines={1} style={styles.singer}>{item.singer}</Text>
                                </View>
                                <PhIcon Icon={PlayCircle} size={26} weight="light" color={theme['c-font-label']} />
                              </TouchableOpacity>
                            )
                          })
                        }
                      </View>
                    ))
                  }
                </ScrollView>
              )
      }
    </View>
  )
}

const styles = createStyle({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 5,
  },
  empty: {
    paddingLeft: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(64),
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 8,
  },
  cover: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: 4,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 8,
  },
  name: {
    fontWeight: 'bold',
  },
  singer: {
    marginTop: 3,
  },
})
