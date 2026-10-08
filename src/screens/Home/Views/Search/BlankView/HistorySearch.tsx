import { useEffect, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { clearHistoryList, getSearchHistory, removeHistoryWord } from '@/core/search/search'
import { Eraser } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { PRESS_OPACITY } from '@/theme/motion'


interface HistorySearchProps {
  onSearch: (keyword: string) => void
}

// 搜索历史：一行横向滚动胶囊 + 清空按钮；挂载时读取（搜索后返回空态会重新挂载，即为最新）
export default ({ onSearch }: HistorySearchProps) => {
  const [list, setList] = useState<string[]>([])
  const theme = useTheme()
  const t = useI18n()
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    void getSearchHistory().then(list => {
      if (isUnmountedRef.current) return
      setList(list)
    })
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handleClear = () => {
    clearHistoryList()
    setList([])
  }

  const handleRemove = (keyword: string) => {
    setList(list => {
      const index = list.indexOf(keyword)
      if (index < 0) return list
      const next = [...list]
      next.splice(index, 1)
      removeHistoryWord(index)
      return next
    })
  }

  if (!list.length) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={13} color={theme['c-font-label']}>{t('search_history_search')}</Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={PRESS_OPACITY}>
          <PhIcon Icon={Eraser} size={14} color={theme['c-300']} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {
          list.map(keyword => (
            // 与热搜词行一致用 TouchableOpacity（项目列表/胶囊的通用写法）
            <TouchableOpacity
              key={keyword}
              style={{ ...styles.button, backgroundColor: theme['c-button-background'] }}
              activeOpacity={PRESS_OPACITY}
              onPress={() => { onSearch(keyword) }}
              onLongPress={() => { handleRemove(keyword) }}
            >
              <Text color={theme['c-button-font']} size={13}>{keyword}</Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </View>
  )
}


const styles = createStyle({
  container: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  clearBtn: {
    padding: 5,
  },
  list: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  button: {
    textAlign: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 14,
    marginRight: 8,
  },
})
