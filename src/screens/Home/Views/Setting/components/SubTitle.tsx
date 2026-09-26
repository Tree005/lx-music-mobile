import { memo, type ComponentType } from 'react'

import { View } from 'react-native'
import { type IconProps } from 'phosphor-react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'

export default memo(({ title, icon, children }: {
  title: string
  /** 分组标题左侧的功能图标（可选），用于单选组这类没有「设置项行」的分组 */
  icon?: ComponentType<IconProps>
  children: React.ReactNode | React.ReactNode[]
}) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon ? <PhIcon Icon={icon} size={18} color={theme['c-primary']} style={styles.titleIcon} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 10,
  },
  title: {
    // 子分组标题沿用普通粗体风格，仅字号更小以区分层级
    fontWeight: 'bold',
  },
})
