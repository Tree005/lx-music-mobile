import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

// 分组容器：标题是「整条浅灰底 + 灰色小字」的 section header（左右通栏）
export default ({ title, children }: Props) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={{ ...styles.titleBar, backgroundColor: theme['c-150'] }}>
        <Text style={styles.title} size={13} color={theme['c-font-label']}>{title}</Text>
      </View>
      <View style={styles.body}>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    // 分组之间留白
    marginBottom: 12,
  },
  titleBar: {
    // 通栏：左右 20 内边距，浅灰底铺满整行
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 9,
    paddingBottom: 9,
    marginBottom: 6,
  },
  title: {
    // 灰色小字，与参考图的 section header 一致
  },
  body: {
    // 设置项自己的左右内边距（20）由各组件提供
  },
})
