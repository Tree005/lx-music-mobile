import { AppState, NativeEventEmitter, NativeModules } from 'react-native'

const { UtilsModule } = NativeModules

export const exitApp = UtilsModule.exitApp

export const getSupportedAbis = UtilsModule.getSupportedAbis

// 封面 → 预渲染背景位图（原生：解码→缩放色雾→压暗→抖动烘焙→WebP 缓存），返回缓存文件路径
export const getBackgroundImage = (url: string): Promise<string> => UtilsModule.getBackgroundImage(url)

export const installApk = (filePath: string, fileProviderAuthority: string) => UtilsModule.installApk(filePath, fileProviderAuthority)


export const screenkeepAwake = () => {
  if (global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = true
  UtilsModule.screenkeepAwake()
}
export const screenUnkeepAwake = () => {
  // console.log('screenUnkeepAwake')
  if (!global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = false
  UtilsModule.screenUnkeepAwake()
}

export const getWIFIIPV4Address = UtilsModule.getWIFIIPV4Address as () => Promise<string>

export const getDeviceName = async(): Promise<string> => {
  return UtilsModule.getDeviceName().then((deviceName: string) => deviceName || 'Unknown')
}

export const isNotificationsEnabled = UtilsModule.isNotificationsEnabled as () => Promise<boolean>

export const requestNotificationPermission = async() => new Promise<boolean>((resolve) => {
  let subscription = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription.remove()
    setTimeout(() => {
      void isNotificationsEnabled().then(resolve)
    }, 1000)
  })
  UtilsModule.openNotificationPermissionActivity().then((result: boolean) => {
    if (result) return
    subscription.remove()
    resolve(false)
  })
})

export const shareText = async(shareTitle: string, title: string, text: string): Promise<void> => {
  UtilsModule.shareText(shareTitle, title, text)
}

export const getSystemLocales = async(): Promise<string> => {
  return UtilsModule.getSystemLocales()
}

export const onScreenStateChange = (handler: (state: 'ON' | 'OFF') => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-state', event => {
    handler(event.state as 'ON' | 'OFF')
  })

  return () => {
    eventListener.remove()
  }
}

export const getWindowSize = async(): Promise<{ width: number, height: number }> => {
  return UtilsModule.getWindowSize()
}

// 让页面内容延伸到系统栏（状态栏/导航栏）后面（不改变系统栏可见性）
// 注意：旧版本原生包里没有这个方法，热更 JS 时不能让它抛错崩掉
export const setEdgeToEdge = (edgeToEdge: boolean) => {
  if (typeof UtilsModule.setEdgeToEdge !== 'function') return
  try {
    UtilsModule.setEdgeToEdge(edgeToEdge)
  } catch (err) {
    console.log('setEdgeToEdge failed', err)
  }
}

// 获取底部系统导航栏高度（dp）；旧版本原生包没有该方法时返回 0
export const getNavigationBarHeight = async(): Promise<number> => {
  if (typeof UtilsModule.getNavigationBarHeight !== 'function') return 0
  try {
    return await (UtilsModule.getNavigationBarHeight as () => Promise<number>)()
  } catch (err) {
    console.log('getNavigationBarHeight failed', err)
    return 0
  }
}

// 锁定/恢复屏幕方向：portraitOnly=true 时禁止系统旋转（「启用横屏」设置关闭时用）
// 注意：旧版本原生包里没有这个方法，热更 JS 时不能让它抛错崩掉
export const setOrientationLock = (portraitOnly: boolean) => {
  if (typeof UtilsModule.setOrientationLock !== 'function') return
  try {
    UtilsModule.setOrientationLock(portraitOnly)
  } catch (err) {
    console.log('setOrientationLock failed', err)
  }
}

export const onWindowSizeChange = (handler: (size: { width: number, height: number }) => void): () => void => {
  UtilsModule.listenWindowSizeChanged()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-size-changed', event => {
    handler(event as { width: number, height: number })
  })

  return () => {
    eventListener.remove()
  }
}

export const isIgnoringBatteryOptimization = async(): Promise<boolean> => {
  return UtilsModule.isIgnoringBatteryOptimization()
}

export const requestIgnoreBatteryOptimization = async() => new Promise<boolean>((resolve) => {
  let subscription = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription.remove()
    setTimeout(() => {
      void isIgnoringBatteryOptimization().then(resolve)
    }, 1000)
  })
  UtilsModule.requestIgnoreBatteryOptimization().then((result: boolean) => {
    if (result) return
    subscription.remove()
    resolve(false)
  })
})
