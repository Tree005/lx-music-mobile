import { useWindowSize } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'
import { isHorizontalMode } from '../tools'


export default () => {
  const windowSize = useWindowSize()
  // 关闭「启用横屏」后强制竖屏布局（配合 Home 里的系统方向锁）
  const isEnableHorizontal = useSettingValue('common.isEnableHorizontal')

  if (!isEnableHorizontal) return false
  return isHorizontalMode(windowSize.width, windowSize.height)
}
