// 竖屏转场/界面切换的共享参数（导航栈 / 设置页 / 心动页透明态共用）

/** 离开「心动」页后，透明态 UI（全屏模糊背景 + 透明底栏）的延迟释放时长（ms）：
 *  页面切走的瞬间立即释放会露出浅色底白闪，延迟一拍再放 */
export const HEARTBEAT_RELEASE_DELAY = 110
/** 导航栈 push/pop 时长（ms） */
export const SLIDE_DURATION_STACK = 150
/** 设置页内部两级时长（ms） */
export const SLIDE_DURATION_SETTING = 110
/** 下层页面视差位移比例（相对屏宽） */
export const SLIDE_PARALLAX_RATIO = 0.3
/** 下层页面蒙层最大不透明度 */
export const SLIDE_SCRIM_OPACITY = 0.08
