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
import { useNavigationBarHeight } from '@/utils/hooks'

// 底栏内容区高度（不含系统导航栏安全区）
const TAB_BAR_HEIGHT = scaleSizeH(44)

const styles = createStyle({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
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
      <Text size={15} color={color}>{t(id)}</Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  const navigationBarHeight = useNavigationBarHeight()

  const handlePress = (id: (typeof BOTTOM_TABS)[number]['id']) => {
    setNavActiveId(id)
  }

  return (
    // 沉浸式：高度加上系统导航栏高度，背景色延伸到屏幕最底部
    <View
      style={{
        ...styles.container,
        height: TAB_BAR_HEIGHT + navigationBarHeight,
        paddingBottom: navigationBarHeight,
        backgroundColor: theme['c-content-background'],
        borderTopColor: theme['c-border-background'],
      }}
    >
      {BOTTOM_TABS.map(item => <TabItem key={item.id} id={item.id} onPress={handlePress} />)}
    </View>
  )
})
