import { useEffect, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getBoardsList, getListDetail } from '@/core/leaderboard'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { PRESS_OPACITY } from '@/theme/motion'

// 榜单歌曲最多显示 10 首（点任意一首播放整榜）
const MAX_RANK_SONG_NUM = 10

interface RankListProps {
  source: LX.OnlineSource | 'all'
  type: 'hot' | 'new'
}

// 榜单歌曲列表（热歌榜 / 新歌榜）：按榜单名称匹配源的对应榜，取第一页前 10 首
// 挂载/源变化时自取数据（core 层有缓存），点击任意一首把整个榜单设为临时列表播放
export default ({ source, type }: RankListProps) => {
  const [list, setList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [boardId, setBoardId] = useState('')
  const [status, setStatus] = useState<'loading' | 'idle' | 'empty'>('loading')
  const theme = useTheme()
  const t = useI18n()
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    setStatus('loading')
    setList([])
    const load = async() => {
      // 聚合源（全部）没有对应榜单，直接空态
      if (source == 'all') {
        setStatus('empty')
        return
      }
      try {
        const keyword = type == 'hot' ? '热歌' : '新歌'
        const boards = await getBoardsList(source)
        if (isUnmountedRef.current) return
        // 匹配优先级：精确名 -> 以「xx榜」结尾 -> 名称含关键词（各源榜单命名不同，如「酷我热歌榜」「巅峰榜·热歌」「热歌榜」）
        const board = boards.find(b => b.name == `${keyword}榜`) ??
          boards.find(b => b.name.endsWith(`${keyword}榜`)) ??
          boards.find(b => b.name.includes(keyword))
        if (!board) {
          setStatus('empty')
          return
        }
        const result = await getListDetail(board.id, 1)
        if (isUnmountedRef.current) return
        const songs = result.list.slice(0, MAX_RANK_SONG_NUM)
        if (!songs.length) {
          setStatus('empty')
          return
        }
        setBoardId(board.id)
        setList(songs)
        setStatus('idle')
      } catch (err) {
        if (isUnmountedRef.current) return
        console.log('get rank songs failed:', err)
        setStatus('empty')
      }
    }
    void load()
    return () => {
      isUnmountedRef.current = true
    }
  }, [source, type])

  // 与首页热门歌曲同模式：整榜设为临时列表，再播第 index 首
  const handlePlay = async(index: number) => {
    await setTempList(`search_rank__${source}_${boardId}`, [...list])
    void playList(LIST_IDS.TEMP, index)
  }

  if (status == 'empty') {
    return <Text style={styles.empty} size={13} color={theme['c-font-label']}>{t('no_item')}</Text>
  }
  if (status == 'loading') return null

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
      {
        list.map((item, index) => (
          <TouchableOpacity
            key={`${item.id}_${index}`}
            style={styles.row}
            activeOpacity={PRESS_OPACITY}
            onPress={() => { void handlePlay(index) }}
          >
            <Text size={15} color={index < 3 ? theme['c-primary'] : theme['c-font-label']} style={styles.index}>{index + 1}</Text>
            <Text size={15} numberOfLines={1} style={styles.name}>
              {item.name} <Text size={12} color={theme['c-font-label']}>{item.singer}</Text>
            </Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
  )
}

const styles = createStyle({
  list: {
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  index: {
    width: 28,
    textAlign: 'center',
  },
  name: {
    flex: 1,
    marginLeft: 8,
  },
  empty: {
    paddingLeft: 20,
    paddingTop: 15,
  },
})
