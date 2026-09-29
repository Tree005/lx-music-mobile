import { useEffect, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getList } from '@/core/hotSearch'

// 热搜词最多显示 10 条
const MAX_HOT_WORD_NUM = 10

interface HotSearchProps {
  source: LX.OnlineSource | 'all'
  onSearch: (keyword: string) => void
}

// 热搜词列表：挂载/源变化时自取数据（core 层有缓存），点击直接搜索
export default ({ source, onSearch }: HotSearchProps) => {
  const [list, setList] = useState<string[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'empty'>('loading')
  const theme = useTheme()
  const t = useI18n()
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    setStatus('loading')
    setList([])
    void getList(source).then(list => {
      if (isUnmountedRef.current) return
      setList(list.slice(0, MAX_HOT_WORD_NUM))
      setStatus(list.length ? 'idle' : 'empty')
    }).catch(err => {
      if (isUnmountedRef.current) return
      console.log('get hot search words failed:', err)
      setStatus('empty')
    })
    return () => {
      isUnmountedRef.current = true
    }
  }, [source])

  if (status == 'empty') {
    return <Text style={styles.empty} size={13} color={theme['c-font-label']}>{t('no_item')}</Text>
  }
  if (status == 'loading') return null

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
      {
        list.map((word, index) => (
          <TouchableOpacity
            key={`${word}_${index}`}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => { onSearch(word) }}
          >
            <Text size={15} color={index < 3 ? theme['c-primary'] : theme['c-font-label']} style={styles.index}>{index + 1}</Text>
            <Text size={15} numberOfLines={1} style={styles.word}>{word}</Text>
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
  word: {
    flex: 1,
    marginLeft: 8,
  },
  empty: {
    paddingLeft: 20,
    paddingTop: 15,
  },
})
