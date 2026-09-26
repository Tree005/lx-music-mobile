import { useCallback, useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { CaretLeft, DownloadSimple, Heart, PlayCircle, type IconProps } from 'phosphor-react-native'
import { type ComponentType } from 'react'

import MusicList from './MusicList'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { getListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { setNavActiveId } from '@/core/common'
import { useHorizontalMode } from '@/utils/hooks'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import listState from '@/store/list/state'

const Action = ({ Icon, label, color, weight, onPress }: {
  Icon: ComponentType<IconProps>
  label: string
  color: string
  weight?: IconProps['weight']
  onPress?: () => void
}) => {
  return (
    <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={onPress}>
      <PhIcon Icon={Icon} size={28} color={color} weight={weight} />
      <Text style={styles.actionLabel} size={14}>{label}</Text>
    </TouchableOpacity>
  )
}

// 歌单详情页（独立子页面，nav_songlist_detail）
// 当前看哪个歌单靠 global.lx.songlistDetailListId 传参
// 歌曲列表复用「单曲」那套（读的是当前列表，进页面前已把它切成这个歌单）
// 「收藏歌单」「全部下载」还没有实现，先只摆出来
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const isHorizontalMode = useHorizontalMode()
  const listInfo = listState.userList.find(l => l.id === global.lx.songlistDetailListId)
  const [firstMusic, setFirstMusic] = useState<LX.Music.MusicInfo | undefined>()
  // 歌单封面用里面第一首歌的封面（歌单本身没有封面字段）
  const picUrl = useMusicPic(firstMusic)

  useEffect(() => {
    if (!listInfo) return
    let isUnmounted = false
    void getListMusics(listInfo.id).then(musics => {
      if (isUnmounted) return
      setFirstMusic(musics[0])
    })
    return () => {
      isUnmounted = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listInfo?.id])

  // 横屏没有「我的」页，退回「我的列表」
  const handleBack = useCallback(() => {
    setNavActiveId(isHorizontalMode ? 'nav_love' : 'nav_mine')
  }, [isHorizontalMode])

  const handlePlayAll = useCallback(() => {
    if (!listInfo) return
    void playList(listInfo.id, 0)
  }, [listInfo])

  // 歌单被删掉后（比如在别处移除）直接留空
  if (!listInfo) return null

  return (
    <View style={styles.container}>
      {/* 顶部只有一个返回箭头：参考图里没有标题栏，但得留个返回入口 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <PhIcon Icon={CaretLeft} size={22} color={theme['c-font']} />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Image style={styles.pic} url={picUrl} />
        <View style={styles.infoText}>
          <Text style={styles.name} size={18} numberOfLines={2}>{listInfo.name}</Text>
          <Text style={styles.desc} size={12} color={theme['c-font-label']} numberOfLines={1} ellipsizeMode="tail">
            {listInfo.source ? t(`source_alias_${listInfo.source}`) : t('songlist_type_user')}
          </Text>
        </View>
      </View>
      <View style={{ ...styles.actions, borderBottomColor: theme['c-border-background'] }}>
        {
          // 从平台收藏/导入的歌单（有 source）显示为已收藏；收藏与取消收藏的动作还没实现
          listInfo.source
            ? <Action Icon={Heart} label={t('collected_songlist')} color={theme['c-primary']} weight="fill" />
            : <Action Icon={Heart} label={t('collect_songlist')} color={theme['c-font']} />
        }
        <Action Icon={PlayCircle} label={t('play_all')} color={theme['c-primary']} weight="fill" onPress={handlePlayAll} />
        <Action Icon={DownloadSimple} label={t('download_all')} color={theme['c-primary']} weight="fill" />
      </View>
      {/* 自建歌单可以把歌从歌单里移除，收藏/导入的歌单暂时不行 */}
      <MusicList embedded detailMode canRemoveMusic={!listInfo.source} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(44),
    paddingLeft: 8,
  },
  backBtn: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 2,
    paddingBottom: 16,
  },
  pic: {
    width: scaleSizeW(100),
    height: scaleSizeW(100),
    borderRadius: 8,
  },
  infoText: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    // 行距压紧：2 行标题 + 副标题的整块高度要和封面相当（对齐参考图比例）
    lineHeight: 21,
  },
  desc: {
    marginTop: 6,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  action: {
    flex: 1,
    alignItems: 'center',
  },
  actionLabel: {
    marginTop: 8,
  },
})
