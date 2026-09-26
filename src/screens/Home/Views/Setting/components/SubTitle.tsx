import { memo } from 'react'

import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  )
})


const styles = createStyle({
  container: {
    // FlatList 已提供 15 的左内边距，这里补 5，与分组标题、设置项左对齐
    paddingLeft: 5,
    // 子分组之间的留白
    marginBottom: 20,
  },
  title: {
    // 子分组标题沿用分组标题的普通粗体风格，仅字号更小以区分层级
    fontWeight: 'bold',
    marginBottom: 8,
    // lineHeight: 16,
  },
})
