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
    // 与分组标题、设置项左对齐（同 20）
    paddingLeft: 20,
    paddingRight: 20,
    // 子分组之间的留白
    marginBottom: 20,
  },
  title: {
    // 子分组标题沿用普通粗体风格，仅字号更小以区分层级
    fontWeight: 'bold',
    marginBottom: 8,
  },
})
