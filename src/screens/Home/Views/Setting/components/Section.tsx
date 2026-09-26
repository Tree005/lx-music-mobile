import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'


interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} size={17}>{title}</Text>
      <View>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    // 分组之间的留白由标题的 marginTop 提供
  },
  title: {
    // 去掉原来的左侧竖线，改为普通粗体标题
    fontWeight: 'bold',
    // FlatList 已提供 15 的左内边距，这里补 5，让标题左边缘与设置项对齐在约 20 处
    paddingLeft: 5,
    // 上方 24 留白用于区分分组，下方 8 留白用于分隔标题与选项
    marginTop: 24,
    marginBottom: 8,
    // lineHeight: 16,
  },
})
