import { memo, useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ListDashes, Pause, Play, Prohibit, Queue, Repeat, RepeatOnce, Shuffle, SkipBack, SkipForward } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle, toast } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { MUSIC_TOGGLE_MODE, MUSIC_TOGGLE_MODE_LIST } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { scaleSizeW } from '@/utils/pixelRatio'

import PlayQueuePopup from '@/components/player/PlayQueuePopup'
import { PRESS_OPACITY } from '@/theme/motion'

// 全屏播放器整页是暗色模糊底，控制区图标统一用白色
const ICON_COLOR = '#fff'
// 两侧小按钮尺寸，中间播放/暂停按钮尺寸在此基础放大
const BTN_WIDTH = scaleSizeW(36)
const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2
// 图标尺寸占按钮的比例（PhIcon 内部还会按屏宽缩放）：
// 播放键按 0.82 时可见字形约 90px ≈ 30dp，上一首/下一首落到约 0.6 倍（对齐参考图实测比例）
const PLAY_ICON_RATIO = 0.82
const SKIP_ICON_RATIO = 0.65

// 循环模式按钮：列表循环 / 随机 / 顺序 / 单曲循环 / 单曲 轮换
const PlayModeBtn = () => {
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const t = useI18n()

  const toggleNextPlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    let modeName: 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop:
        modeName = 'play_list_loop'
        break
      case MUSIC_TOGGLE_MODE.random:
        modeName = 'play_list_random'
        break
      case MUSIC_TOGGLE_MODE.list:
        modeName = 'play_list_order'
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
        modeName = 'play_single_loop'
        break
      default:
        modeName = 'play_single'
        break
    }
    toast(t(modeName))
  }

  const playModeIcon = useMemo(() => {
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop:
        return Repeat
      case MUSIC_TOGGLE_MODE.random:
        return Shuffle
      case MUSIC_TOGGLE_MODE.list:
        return ListDashes
      case MUSIC_TOGGLE_MODE.singleLoop:
        return RepeatOnce
      default:
        return Prohibit
    }
  }, [togglePlayMethod])

  return (
    <TouchableOpacity style={styles.sideBtn} activeOpacity={PRESS_OPACITY} onPress={toggleNextPlayMode}>
      <PhIcon Icon={playModeIcon} color={ICON_COLOR} size={20} />
    </TouchableOpacity>
  )
}

// 播放列表按钮：打开播放队列弹层
const QueueBtn = () => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <TouchableOpacity style={styles.sideBtn} activeOpacity={PRESS_OPACITY} onPress={() => { setVisible(true) }}>
        <PhIcon Icon={Queue} color={ICON_COLOR} size={20} />
      </TouchableOpacity>
      <PlayQueuePopup visible={visible} onClose={() => { setVisible(false) }} />
    </>
  )
}

// 幽灵点击防御：系统层偶发「无触摸的 click」（不经过 onPressIn 直接触发 onPress，
// 实测切回前台时会连环重放这类 click，把上一首按钮反复触发造成连环跳歌）。
// 真实操作必然先经过 onPressIn，用时间戳判定：没有近期触摸的 onPress 直接忽略
const REAL_TOUCH_WINDOW = 3000
let prevTouchAt = 0
let nextTouchAt = 0
let playTouchAt = 0

/** 各控制键的行为/状态覆盖（心动页复用时传入；不传 = 调用全局播放控制） */
export interface ControlBtnOverrides {
  /** 覆盖播放按钮的图标状态 */
  isPlay?: boolean
  /** 覆盖播放/暂停行为 */
  onTogglePlay?: () => void
  onPrev?: () => void
  onNext?: () => void
  /** 隐藏「播放顺序」切换键（心动流永远随机推歌，该键无意义） */
  hidePlayMode?: boolean
  /** 隐藏「播放队列」键（心动页不需要队列入口） */
  hideQueue?: boolean
}

const PrevBtn = ({ size, onPrev }: { size: number, onPrev?: () => void }) => {
  const handlePlayPrev = () => {
    if (Date.now() - prevTouchAt > REAL_TOUCH_WINDOW) return
    prevTouchAt = 0
    if (onPrev) onPrev()
    else void playPrev()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={PRESS_OPACITY}
      onPress={handlePlayPrev}
      onPressIn={() => { prevTouchAt = Date.now() }}
    >
      <PhIcon Icon={SkipBack} color={ICON_COLOR} size={size * SKIP_ICON_RATIO} weight="fill" />
    </TouchableOpacity>
  )
}
const NextBtn = ({ size, onNext }: { size: number, onNext?: () => void }) => {
  const handlePlayNext = () => {
    if (Date.now() - nextTouchAt > REAL_TOUCH_WINDOW) return
    nextTouchAt = 0
    if (onNext) onNext()
    else void playNext()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={PRESS_OPACITY}
      onPress={handlePlayNext}
      onPressIn={() => { nextTouchAt = Date.now() }}
    >
      <PhIcon Icon={SkipForward} color={ICON_COLOR} size={size * SKIP_ICON_RATIO} weight="fill" />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size, isPlay: isPlayOverride, onTogglePlay }: { size: number, isPlay?: boolean, onTogglePlay?: () => void }) => {
  const globalIsPlay = useIsPlay()
  const isPlay = isPlayOverride ?? globalIsPlay
  const handleTogglePlay = () => {
    if (Date.now() - playTouchAt > REAL_TOUCH_WINDOW) return
    playTouchAt = 0
    if (onTogglePlay) onTogglePlay()
    else togglePlay()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={PRESS_OPACITY}
      onPress={handleTogglePlay}
      onPressIn={() => { playTouchAt = Date.now() }}
    >
      <PhIcon Icon={isPlay ? Pause : Play} color={ICON_COLOR} size={size * PLAY_ICON_RATIO} weight="fill" />
    </TouchableOpacity>
  )
}

export default memo(({ overrides }: { overrides?: ControlBtnOverrides } = {}) => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  // 中间播放按钮放大，上一首/下一首跟随缩小一档
  const size = Math.min(Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)
  const sideSize = size * 0.75

  // 心动页的 3 键形态（无播放顺序/队列键）：居中排布、键距固定，避免 space-between 把两端键顶到边
  const isCompact = !!(overrides?.hidePlayMode && overrides?.hideQueue)

  return (
    <View style={[styles.conatiner, isCompact && styles.compact]}>
      {!overrides?.hidePlayMode && <PlayModeBtn />}
      <PrevBtn size={sideSize} onPrev={overrides?.onPrev} />
      <TogglePlayBtn size={size} isPlay={overrides?.isPlay} onTogglePlay={overrides?.onTogglePlay} />
      <NextBtn size={sideSize} onNext={overrides?.onNext} />
      {!overrides?.hideQueue && <QueueBtn />}
    </View>
  )
})


const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: '4%',
    // 与时间行的间距（底部留白由 Player 容器负责）
    paddingTop: 16,
    paddingBottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  sideBtn: {
    width: BTN_WIDTH,
    height: BTN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 3 键形态：居中 + 固定键距
  compact: {
    justifyContent: 'center',
    gap: scaleSizeW(52),
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
