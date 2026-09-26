import { memo, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
// import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { DotsThreeVertical, Heart } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Image from '@/components/common/Image'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_IDS, LIST_ITEM_HEIGHT } from '@/config/constant'
import { createStyle, type RowInfo } from '@/utils/tools'
import { useMusicPic } from '@/utils/hooks/useMusicPic'
import { getListMusics } from '@/core/list'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)
/** 歌单详情页的行：带封面，比列表模式高一些 */
export const PIC_ITEM_HEIGHT = scaleSizeH(68)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  }

  return info
}

export default memo(({ item, index, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval, showPic = false, onToggleLove }: {
  item: LX.Music.MusicInfoOnline
  index: number
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
  /** 歌单详情页样式：显示封面与收藏按钮（隐藏序号、音质标签与时长） */
  showPic?: boolean
  onToggleLove?: (item: LX.Music.MusicInfoOnline, isLoved: boolean) => void
}) => {
  const theme = useTheme()

  const isSelected = selectedList.includes(item)

  const moreButtonRef = useRef<TouchableOpacity>(null)
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const tagInfo = useQualityTag(item)
  // 在线歌曲的 meta.picUrl 通常是空的，这里按需去音源接口取（内部有缓存）
  const picUrl = useMusicPic(showPic ? item : undefined)
  // null 表示还没查到初始值
  const [loved, setLoved] = useState<boolean | null>(null)

  useEffect(() => {
    if (!showPic) return
    let isUnmounted = false
    void getListMusics(LIST_IDS.LOVE).then(list => {
      if (isUnmounted) return
      setLoved(list.some(m => m.id == item.id))
    })
    return () => {
      isUnmounted = true
    }
  }, [showPic, item.id])

  const handleToggleLove = () => {
    const isLoved = loved ?? false
    setLoved(!isLoved)
    onToggleLove?.(item, isLoved)
  }

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={{
      ...styles.listItem,
      width: rowInfo.rowWidth,
      height: showPic ? PIC_ITEM_HEIGHT : ITEM_HEIGHT,
      backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)',
    }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }}>
        {
          showPic
            ? <Image style={styles.pic} url={picUrl} />
            : <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        }
        <View style={styles.itemInfo}>
          <Text numberOfLines={1}>{item.name}</Text>
          {
            showPic
              ? <Text style={styles.listItemSingleTextPic} size={13} color={theme['c-500']} numberOfLines={1}>{singer}</Text>
              : (
                  <View style={styles.listItemSingle}>
                    { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
                    { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
                    <Text style={styles.listItemSingleText} size={11} color={theme['c-500']} numberOfLines={1}>{singer}</Text>
                  </View>
                )
          }
        </View>
        {
          !showPic && isShowInterval ? (
            <Text size={12} color={theme['c-250']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
      </TouchableOpacity>
      {
        showPic
          ? (
              <TouchableOpacity style={styles.iconButton} onPress={handleToggleLove}>
                <PhIcon Icon={Heart} size={20} color={loved ? theme['c-primary'] : theme['c-350']} weight={loved ? 'fill' : 'regular'} />
              </TouchableOpacity>
            )
          : null
      }
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={showPic ? styles.iconButton : styles.moreButton}>
        <PhIcon Icon={DotsThreeVertical} color={theme['c-350']} size={showPic ? 20 : 12} />
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(prevProps.item)
  )
})

const styles = createStyle({
  listItem: {
    // width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // paddingLeft: 10,
    paddingRight: 2,
    alignItems: 'center',
    // borderBottomWidth: BorderWidths.normal,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: 38,
    // fontSize: 12,
    textAlign: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  pic: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: 20,
    marginRight: 14,
  },
  iconButton: {
    height: '100%',
    paddingLeft: 12,
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 2,
    // paddingTop: 10,
    // paddingBottom: 10,
  },
  // listItemTitle: {
  //   // backgroundColor: 'rgba(0,0,0,0.2)',
  //   flexGrow: 0,
  //   flexShrink: 1,
  //   // fontSize: 15,
  // },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    // alignItems: 'flex-end',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  listItemTimeLabel: {
    marginRight: 5,
    fontWeight: '400',
  },
  listItemSingleText: {
    // fontSize: 13,
    // paddingTop: 2,
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
  },
  listItemSingleTextPic: {
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
    paddingTop: 3,
  },
  listItemBadge: {
    // fontSize: 10,
    paddingLeft: 5,
    paddingTop: 2,
    alignSelf: 'flex-start',
  },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },
  moreButton: {
    height: '80%',
    paddingLeft: 16,
    paddingRight: 16,
    // paddingTop: 10,
    // paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
  },
})
