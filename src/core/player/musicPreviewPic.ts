// 滑动切歌的「预览封面」通道：SwipeSongContainer 在滑动方向确定的瞬间上报
// 「将要滑进来的那张封面」（与滑动预览卡片同一数据源），播放页背景（Background）订阅后
// 提前开始慢渐变——把整屏模糊大图的变化摊开在手势过程里，不再等切歌落地才开始变。
// 回弹 / 切歌完成后由上报方清空（null），背景回落真实封面。
//
// 说明：这是 UI 侧的纯内存通道，不进 store、不落盘；多个 SwipeSongContainer 实例
// 同时存在时以「正在接收触摸的那个」为唯一写入方（同一时刻只可能有一个）。

let previewPic: string | null = null
const listeners = new Set<() => void>()

/** 上报预览封面；null = 清除（回落真实封面）。空串按 null 处理（等待中的封面不做提前渐变） */
export const setMusicPreviewPic = (pic: string | null) => {
  const next = pic != null && pic !== '' ? pic : null
  if (next === previewPic) return
  previewPic = next
  for (const listener of listeners) listener()
}

export const getMusicPreviewPic = () => previewPic

export const subscribeMusicPreviewPic = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
