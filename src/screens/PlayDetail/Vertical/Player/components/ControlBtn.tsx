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
    <TouchableOpacity style={styles.sideBtn} activeOpacity={0.5} onPress={toggleNextPlayMode}>
      <PhIcon Icon={playModeIcon} color={ICON_COLOR} size={20} />
    </TouchableOpacity>
  )
}

// 播放列表按钮：打开播放队列弹层
const QueueBtn = () => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <TouchableOpacity style={styles.sideBtn} activeOpacity={0.5} onPress={() => { setVisible(true) }}>
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

const PrevBtn = ({ size }: { size: number }) => {
  const handlePlayPrev = () => {
    if (Date.now() - prevTouchAt > REAL_TOUCH_WINDOW) return
    prevTouchAt = 0
    void playPrev()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.5}
      onPress={handlePlayPrev}
      onPressIn={() => { prevTouchAt = Date.now() }}
    >
      <PhIcon Icon={SkipBack} color={ICON_COLOR} size={size * SKIP_ICON_RATIO} weight="fill" />
    </TouchableOpacity>
  )
}
const NextBtn = ({ size }: { size: number }) => {
  const handlePlayNext = () => {
    if (Date.now() - nextTouchAt > REAL_TOUCH_WINDOW) return
    nextTouchAt = 0
    void playNext()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.5}
      onPress={handlePlayNext}
      onPressIn={() => { nextTouchAt = Date.now() }}
    >
      <PhIcon Icon={SkipForward} color={ICON_COLOR} size={size * SKIP_ICON_RATIO} weight="fill" />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const handleTogglePlay = () => {
    if (Date.now() - playTouchAt > REAL_TOUCH_WINDOW) return
    playTouchAt = 0
    togglePlay()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.5}
      onPress={handleTogglePlay}
      onPressIn={() => { playTouchAt = Date.now() }}
    >
      <PhIcon Icon={isPlay ? Pause : Play} color={ICON_COLOR} size={size * PLAY_ICON_RATIO} weight="fill" />
    </TouchableOpacity>
  )
}

export default memo(() => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  // 中间播放按钮放大，上一首/下一首跟随缩小一档
  const size = Math.min(Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)
  const sideSize = size * 0.75

  return (
    <View style={styles.conatiner}>
      <PlayModeBtn />
      <PrevBtn size={sideSize} />
      <TogglePlayBtn size={size} />
      <NextBtn size={sideSize} />
      <QueueBtn />
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
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
