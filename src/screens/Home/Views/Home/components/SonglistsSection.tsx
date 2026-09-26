import { useEffect, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { getList } from '@/core/songlist'
import { getSongListSetting } from '@/utils/data'
import songlistState, { type ListInfoItem } from '@/store/songlist/state'

// 首页推荐歌单网格：3 列 2 行，共 6 个
const MAX_SONGLIST_NUM = 6
// 每行卡片数，用于计算末行补位
const COLUMN_NUM = 3

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const [list, setList] = useState<ListInfoItem[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'empty'>('loading')
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false

    const load = async() => {
      // 内置音源已清空、未导入自定义音源时，歌单数据拿不到，直接走空态
      if (!songlistState.sources.length) {
        setStatus('empty')
        return
      }
      try {
        const { source, sortId } = await getSongListSetting()
        // tabId 传空串表示「推荐」，sortId 沿用用户上次在歌单页选择的值
        const result = await getList(source, '', sortId, 1)
        if (isUnmountedRef.current) return
        if (!result?.list?.length) {
          setStatus('empty')
          return
        }
        setList(result.list.slice(0, MAX_SONGLIST_NUM))
        setStatus('idle')
      } catch (err) {
        // 请求异常同样降级为空态，保证不白屏、不抛错
        if (isUnmountedRef.current) return
        console.log('get songlist list failed:', err)
        setStatus('empty')
      }
    }
    void load()

    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handleMore = () => {
    setNavActiveId('nav_songlist')
  }
  const handleSonglistPress = () => {
    setNavActiveId('nav_songlist')
  }

  // 末行不足 3 个时补占位，避免最后两个卡片被 space-between 撑到两端
  const placeholderNum = (COLUMN_NUM - (list.length % COLUMN_NUM)) % COLUMN_NUM

  return (
    <View>
      <View style={styles.header}>
        <Text size={18} style={styles.title}>{t('home_section_songlists')}</Text>
        <TouchableOpacity style={styles.more} activeOpacity={0.7} onPress={handleMore}>
          <Text size={13} color={theme['c-primary']}>{t('home_more')}</Text>
          <Icon name="chevron-right" size={13} color={theme['c-primary']} />
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
                <View style={styles.grid}>
                  {
                    list.map(item => (
                      <TouchableOpacity key={item.id} activeOpacity={0.7} style={styles.gridItem} onPress={handleSonglistPress}>
                        <Image url={item.img} style={styles.songlistImg} />
                        <Text style={styles.songlistName} numberOfLines={2} size={12}>{item.name}</Text>
                      </TouchableOpacity>
                    ))
                  }
                  {
                    Array(placeholderNum).fill(0).map((_, index) => (
                      <View key={`placeholder-${index}`} style={styles.gridItem} />
                    ))
                  }
                </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  gridItem: {
    width: '31%',
    marginBottom: 16,
  },
  songlistImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  songlistName: {
    marginTop: 7,
  },
})
