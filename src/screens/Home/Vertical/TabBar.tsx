import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BOTTOM_TABS, TAB_OF_ID } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'

const styles = createStyle({
  container: {
    flexDirection: 'row',
    height: scaleSizeH(44),
    borderTopWidth: 1,
    paddingBottom: scaleSizeH(2),
  },
  item: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

// 底部 Tab 只显示文字（不显示图标）
const TabItem = ({ id, onPress }: {
  id: (typeof BOTTOM_TABS)[number]['id']
  onPress: (id: (typeof BOTTOM_TABS)[number]['id']) => void
}) => {
  const t = useI18n()
  const theme = useTheme()
  const activeId = useNavActiveId()
  // 用 TAB_OF_ID 映射，子页面时高亮其归属的父 Tab
  const active = TAB_OF_ID[activeId] === id
  const color = active ? theme['c-primary'] : theme['c-font-label']

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => { onPress(id) }}>
      <Text size={14} color={color}>{t(id)}</Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()

  const handlePress = (id: (typeof BOTTOM_TABS)[number]['id']) => {
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'], borderTopColor: theme['c-border-background'] }}>
      {BOTTOM_TABS.map(item => <TabItem key={item.id} id={item.id} onPress={handlePress} />)}
    </View>
  )
})
