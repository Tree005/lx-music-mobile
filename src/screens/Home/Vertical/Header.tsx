import { View } from 'react-native'
import { useStatusbarHeight } from '@/store/common/hook'
import StatusBar from '@/components/common/StatusBar'

// 各页面不再使用统一标题栏：
// - 首页 / AI助手 / 我的 的内容自带顶部布局
// - 子页面由 SubPageHeader 提供返回栏
// 这里只负责设置状态栏样式，并留出一个状态栏高度的占位
// （StatusBar 是 translucent，自身不占位，内容会顶到状态栏下）
const Header = () => {
  const statusBarHeight = useStatusbarHeight()

  return (
    <>
      <StatusBar />
      <View style={{ height: statusBarHeight }} />
    </>
  )
}

export default Header
