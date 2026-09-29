import { useEffect, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import { useMainSource } from '@/core/mainSource'
import { scaleSizeW, setSpText } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import { CaretRight, Play } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Image from '@/components/common/Image'
import { getList } from '@/core/songlist'
import { getSongListSetting } from '@/utils/data'
import songlistState, { type ListInfoItem } from '@/store/songlist/state'

// 首页推荐歌单：横向滚动大卡片，最多取 10 个
const MAX_SONGLIST_NUM = 10

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const mainSource = useMainSource()
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
        const { sortId } = await getSongListSetting()
        // tabId 传空串表示「推荐」，sortId 沿用用户上次在歌单页选择的值
        const result = await getList(mainSource, '', sortId, 1)
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
  }, [mainSource])

  const handleMore = () => {
    setNavActiveId('nav_songlist')
  }
  const handleSonglistPress = () => {
    setNavActiveId('nav_songlist')
  }

  return (
    <View>
      <View style={styles.header}>
        <Text size={18} style={styles.title}>{t('home_section_songlists')}</Text>
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
                    list.map(item => (
                      <TouchableOpacity key={item.id} activeOpacity={0.7} style={styles.card} onPress={handleSonglistPress}>
                        <View style={styles.coverWrap}>
                          <Image url={item.img} style={styles.cover} />
                          {/* 封面右下角播放按钮：仅作视觉提示，点击整卡进入歌单页 */}
                          <View style={styles.playBtn}>
                            <PhIcon Icon={Play} size={18} weight="fill" color="#fff" />
                          </View>
                        </View>
                        <Text style={styles.cardName} numberOfLines={2} size={13}>{item.name}</Text>
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
    width: scaleSizeW(150),
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playBtn: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    marginTop: 8,
    lineHeight: setSpText(18),
  },
})
