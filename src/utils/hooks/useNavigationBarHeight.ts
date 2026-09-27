import { useEffect, useState } from 'react'
import { getNavigationBarHeight } from '@/utils/nativeModules/utils'

// 导航栏高度只在首次需要时向原生取一次（设备不旋转时不会变），全局缓存
let cache = 0
let pending: Promise<number> | null = null

const load = async(): Promise<number> => {
  if (pending == null) {
    pending = getNavigationBarHeight().then(height => {
      cache = height
      return height
    }).catch(() => 0)
  }
  return pending
}

export default () => {
  const [height, setHeight] = useState(cache)

  useEffect(() => {
    if (cache > 0) return
    let unmounted = false
    void load().then(height => {
      if (!unmounted && height > 0) setHeight(height)
    })
    return () => {
      unmounted = true
    }
  }, [])

  return height
}
