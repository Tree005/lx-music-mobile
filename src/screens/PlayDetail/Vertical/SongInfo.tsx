import { memo, useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { ChatCircle, DotsThree, Heart } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import { addListMusics, getListMusics, removeListMusics } from '@/core/list'
import settingState from '@/store/setting/state'
import { LIST_IDS } from '@/config/constant'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { createStyle } from '@/utils/tools'

// 整页是暗色模糊底，信息行文字统一用白色
const TITLE_COLOR = '#fff'
const SINGER_COLOR = 'rgba(255, 255, 255, 0.7)'

// 歌曲信息行：左边歌名 + 歌手，右边收藏按钮（可选评论/⋯ 按钮）
// 传入 musicInfoOverride 时显示指定歌曲（心动页的快照歌，可能不在播放）；null = 不渲染整行
export default memo(({ musicInfoOverride, showMore = false, onMore, onComment }: {
  /** 显示这首歌的信息（缺省 = 全局当前播放歌；null = 不渲染整行） */
  musicInfoOverride?: LX.Music.MusicInfo | null
  /** 在评论按钮右侧显示 ⋯ 按钮 */
  showMore?: boolean
  onMore?: () => void
  /** 评论点击行为覆盖（缺省跳转到当前播放歌的评论页） */
  onComment?: () => void
} = {}) => {
  const theme = useTheme()
  const playerMusicInfo = usePlayerMusicInfo()
  // 传了 musicInfoOverride（包括 null）就用外部数据源
  const musicInfo = musicInfoOverride === undefined ? playerMusicInfo : musicInfoOverride
  const musicId = musicInfo?.id
  const [loved, setLoved] = useState(false)

  // 查询歌曲是否已在「我的收藏」，并监听收藏列表变化刷新
  useEffect(() => {
    if (!musicId) {
      setLoved(false)
      return
    }
    let isUnmounted = false
    const check = async() => {
      const list = await getListMusics(LIST_IDS.LOVE)
      if (!isUnmounted) setLoved(list.some(m => m.id == musicId))
    }
    void check()
    const handleListUpdate = (ids: string[]) => {
      if (ids.includes(LIST_IDS.LOVE)) void check()
    }
    global.app_event.on('myListMusicUpdate', handleListUpdate)
    return () => {
      isUnmounted = true
      global.app_event.off('myListMusicUpdate', handleListUpdate)
    }
  }, [musicId])

  // 心动页空态传入 null 时整行不渲染
  if (musicInfo == null) return null

  const handleToggleLove = () => {
    if (!musicId) return
    // 先乐观更新图标，收藏列表变更事件会再做一次校准
    setLoved(!loved)
    // override 的歌不是全局当前播放歌时，collect/uncollectMusic 操作的是当前播放歌，
    // 所以直接操作收藏列表
    if (musicInfoOverride != null && musicInfoOverride.id !== playerMusicInfo.id) {
      if (loved) {
        void removeListMusics(LIST_IDS.LOVE, [musicId])
      } else {
        void addListMusics(LIST_IDS.LOVE, [musicInfoOverride], settingState.setting['list.addMusicLocationType'])
      }
    } else {
      if (loved) uncollectMusic()
      else collectMusic()
    }
  }

  const handleShowComment = () => {
    if (onComment) onComment()
    else navigations.pushCommentScreen(commonState.componentIds.playDetail!)
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text numberOfLines={1} size={20} color={TITLE_COLOR} style={styles.name}>{musicInfo.name}</Text>
        <Text numberOfLines={1} size={14} color={SINGER_COLOR} style={styles.singer}>{musicInfo.singer}</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={handleToggleLove}>
        <PhIcon Icon={Heart} size={24} weight={loved ? 'fill' : 'regular'} color={loved ? theme['c-primary'] : TITLE_COLOR} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={handleShowComment}>
        <PhIcon Icon={ChatCircle} size={23} color={TITLE_COLOR} />
      </TouchableOpacity>
      {showMore
        ? (
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={onMore}>
              <PhIcon Icon={DotsThree} size={23} color={TITLE_COLOR} />
            </TouchableOpacity>
          )
        : null}
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    // 与上方歌词块的间距（参考汽水：约封面高度的 0.121，明显大于其他间距）
    paddingTop: 28,
    paddingBottom: 0,
  },
  info: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 10,
  },
  name: {
    fontWeight: '600',
  },
  singer: {
    marginTop: 4,
  },
  actionBtn: {
    padding: 6,
  },
})
