import { useHorizontalMode } from '@/utils/hooks'
import Vertical, { type SettingVerticalType } from './Vertical'
import Horizontal from './Horizontal'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { useCallback, useRef } from 'react'
// import { AppColors } from '@/theme'
import commonState from '@/store/common/state'
import { setNavActiveId } from '@/core/common'

export type { SettingScreenIds } from './Main'

export default () => {
  const isHorizontalMode = useHorizontalMode()
  const verticalRef = useRef<SettingVerticalType | null>(null)
  useBackHandler(useCallback(() => {
    // 竖屏设置页内部有「主页 / 二级页」两层，先让它退一层
    if (verticalRef.current?.back()) return true
    if (Object.keys(commonState.componentIds).length == 1 && commonState.navActiveId == 'nav_setting') {
      setNavActiveId(commonState.lastNavActiveId)
      return true
    }
    return false
  }, []))

  return isHorizontalMode
    ? <Horizontal />
    : <Vertical ref={verticalRef} />
}
