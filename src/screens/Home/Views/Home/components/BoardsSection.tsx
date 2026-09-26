import { useEffect, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import { scaleSizeW } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import { CaretRight } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { getBoardsList } from '@/core/leaderboard'
import { getLeaderboardSetting } from '@/utils/data'
import leaderboardState, { type BoardItem } from '@/store/leaderboard/state'

// 首页排行榜：横向滚动小卡片，最多取 6 个
const MAX_BOARD_NUM = 6
// 榜单数据没有封面图，卡片用纯色底占位，按索引循环取色
const BOARD_CARD_COLORS = ['#7C6FE8', '#3FB980', '#4A9FE0', '#E0A24A', '#E86F8F', '#5DC5C0']

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const [list, setList] = useState<BoardItem[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'empty'>('loading')
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
        const { source } = await getLeaderboardSetting()
        const boards = await getBoardsList(source)
        if (isUnmountedRef.current) return
        if (!boards?.length) {
          setStatus('empty')
          return
        }
        setList(boards.slice(0, MAX_BOARD_NUM))
        setStatus('idle')
      } catch (err) {
        // 请求异常同样降级为空态，保证不白屏、不抛错
        if (isUnmountedRef.current) return
        console.log('get boards list failed:', err)
        setStatus('empty')
      }
    }
    void load()

    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handleMore = () => {
    setNavActiveId('nav_top')
  }
  const handleBoardPress = () => {
    setNavActiveId('nav_top')
  }

  return (
    <View>
      <View style={styles.header}>
        <Text size={18} style={styles.title}>{t('home_section_boards')}</Text>
        <TouchableOpacity style={styles.more} activeOpacity={0.7} onPress={handleMore}>
          <Text size={13} color={theme['c-primary']}>{t('home_more')}</Text>
          <PhIcon Icon={CaretRight} size={13} color={theme['c-primary']} />
        </TouchableOpacity>
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
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {
                    list.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={styles.card}
                        onPress={handleBoardPress}
                      >
                        <View
                          style={{ ...styles.boardCard, backgroundColor: BOARD_CARD_COLORS[index % BOARD_CARD_COLORS.length] }}
                        >
                          <Text size={13} color="#fff" numberOfLines={2} style={styles.boardCardText}>{item.name}</Text>
                        </View>
                        <Text size={13} numberOfLines={1} style={styles.boardName}>{item.name}</Text>
                      </TouchableOpacity>
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
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  empty: {
    paddingLeft: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 12,
  },
  card: {
    width: scaleSizeW(100),
  },
  boardCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 6,
  },
  boardCardText: {
    textAlign: 'center',
  },
  boardName: {
    marginTop: 7,
    textAlign: 'center',
  },
})
