import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'

interface Props {
  title?: string
  children: React.ReactNode | React.ReactNode[]
}

// 分组容器（卡片化）：卡片外的小灰字标题 + 白色圆角卡片，页面浅灰底透在卡片四周
export default ({ title, children }: Props) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {title
        ? <Text style={styles.title} size={13} color={theme['c-font-label']}>{title}</Text>
        : null}
      <View style={{ ...styles.card, backgroundColor: theme['c-content-background'] }}>
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
  title: {
    // 卡片外小灰字标题，与卡片内容左缘对齐
    marginLeft: 24,
    marginBottom: 6,
  },
  card: {
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 8,
    // 裁剪内容，保证圆角下不出底
    overflow: 'hidden',
  },
})
