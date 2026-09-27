import { memo, useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Heart } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import { getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'

// 整页是暗色模糊底，信息行文字统一用白色
const TITLE_COLOR = '#fff'
const SINGER_COLOR = 'rgba(255, 255, 255, 0.7)'

// 歌曲信息行：左边歌名 + 歌手，右边收藏按钮
export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const [loved, setLoved] = useState(false)

  // 查询当前歌曲是否已在「我的收藏」，并监听收藏列表变化刷新
  useEffect(() => {
    const id = musicInfo.id
    if (!id) {
      setLoved(false)
      return
    }
    let isUnmounted = false
    const check = async() => {
      const list = await getListMusics(LIST_IDS.LOVE)
      if (!isUnmounted) setLoved(list.some(m => m.id == id))
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
  }, [musicInfo.id])

  const handleToggleLove = () => {
    if (!musicInfo.id) return
    // 先乐观更新图标，收藏列表变更事件会再做一次校准
    setLoved(!loved)
    if (loved) uncollectMusic()
    else collectMusic()
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text numberOfLines={1} size={18} color={TITLE_COLOR} style={styles.name}>{musicInfo.name}</Text>
        <Text numberOfLines={1} size={13} color={SINGER_COLOR} style={styles.singer}>{musicInfo.singer}</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={handleToggleLove}>
        <PhIcon Icon={Heart} size={22} weight={loved ? 'fill' : 'regular'} color={loved ? theme['c-primary'] : TITLE_COLOR} />
      </TouchableOpacity>
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
