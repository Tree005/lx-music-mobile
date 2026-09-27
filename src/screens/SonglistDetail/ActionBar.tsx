import { memo, type ComponentType } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { DownloadSimple, Heart, PlayCircle, type IconProps } from 'phosphor-react-native'

import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import listState from '@/store/list/state'
import { useListInfo } from './state'

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

// 从存储的歌单来源标识里取出歌单 id：
// 收藏/导入时 sourceListId 存的是分享链接（如 https://www.kuwo.cn/playlist_detail/3677105457
// 或 https://y.music.163.com/m/playlist?id=5381722575&userid=...），也可能是纯 id
const pickSourceListId = (raw: string): string => {
  const matched = /[?&]id=([^&#]+)/.exec(raw) ?? /\/([^/?#]+)\/?(?:[?#]|$)/.exec(raw)
  return matched ? matched[1] : raw
}

// 三个操作：收藏歌单（已收藏则显示已收藏）/ 播放全部 / 全部下载
// 「全部下载」还没实现，先只摆出来
export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()

  // 收藏过这个歌单的话，userList 里会有对应记录（同一平台 + 歌单 id 一致）
  const isCollected = listState.userList.some(l =>
    l.source === info.source &&
    l.sourceListId != null &&
    pickSourceListId(l.sourceListId) === String(info.id),
  )

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={{ ...styles.container, borderBottomColor: theme['c-border-background'] }}>
      {
        isCollected
          ? <Action Icon={Heart} label={t('collected_songlist')} color={theme['c-primary']} weight="fill" onPress={handleCollection} />
          : <Action Icon={Heart} label={t('collect_songlist')} color={theme['c-font']} onPress={handleCollection} />
      }
      <Action Icon={PlayCircle} label={t('play_all')} color={theme['c-primary']} weight="fill" onPress={handlePlayAll} />
      <Action Icon={DownloadSimple} label={t('download_all')} color={theme['c-primary']} weight="fill" />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
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
