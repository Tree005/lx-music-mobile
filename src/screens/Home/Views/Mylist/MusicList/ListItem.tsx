import { memo, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { LIST_IDS, LIST_ITEM_HEIGHT } from '@/config/constant'
// import { BorderWidths } from '@/theme'
import { DotsThreeVertical, Heart, PlayCircle, Trash } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Image from '@/components/common/Image'
import { createStyle, type RowInfo } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useAssertApiSupport } from '@/store/common/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'
import { getListMusics } from '@/core/list'
import { useMusicPic } from '@/utils/hooks/useMusicPic'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)
/** 歌单详情页的行：带封面，比列表模式高一些 */
export const PIC_ITEM_HEIGHT = scaleSizeH(68)
/** 已收藏的红心颜色（不跟随主题，参考图效果） */
const LOVED_HEART_COLOR = '#F04A5A'


export default memo(({ item, index, activeIndex, onPress, onShowMenu, onLongPress, selectedList, rowInfo, isShowAlbumName, isShowInterval, showPic = false, showRemove = false, onRemoveItem, onToggleLove }: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfo[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
  /** 歌单详情页样式：显示封面、收藏与移除按钮（隐藏序号、来源标签与时长） */
  showPic?: boolean
  /** 显示「从歌单移除」按钮（只有自建歌单可以） */
  showRemove?: boolean
  onRemoveItem?: (item: LX.Music.MusicInfo, index: number) => void
  onToggleLove?: (item: LX.Music.MusicInfo, isLoved: boolean) => void
}) => {
  const theme = useTheme()

  const isSelected = selectedList.includes(item)
  // console.log(item.name, selectedList, selectedList.includes(item))
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<TouchableOpacity>(null)
  // null 表示还没查到初始值
  const [loved, setLoved] = useState<boolean | null>(null)
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const active = activeIndex == index
  // 在线歌曲的 meta.picUrl 常常是空的，这里按需去音源接口取（内部有缓存）
  const picUrl = useMusicPic(showPic ? item : undefined)

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

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

  return (
    <View style={{
      ...styles.listItem,
      width: rowInfo.rowWidth,
      height: showPic ? PIC_ITEM_HEIGHT : ITEM_HEIGHT,
      backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)',
      opacity: isSupported ? 1 : 0.5,
    }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }}>
        {
          showPic
            ? <Image style={styles.pic} url={picUrl} />
            : active
              ? <View style={styles.sn}><PhIcon Icon={PlayCircle} size={13} color={theme['c-primary-font']} /></View>
              : <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        }
        <View style={styles.itemInfo}>
          {/* <View style={styles.listItemTitle}> */}
          <Text color={active ? theme['c-primary-font'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
          {/* </View> */}
          {
            showPic
              ? <Text style={styles.listItemSingleText} size={13} color={theme['c-500']} numberOfLines={1}>{singer}</Text>
              : (
                  <View style={styles.listItemSingle}>
                    <Badge>{item.source.toUpperCase()}</Badge>
                    <Text style={styles.listItemSingleText} size={11} color={active ? theme['c-primary-alpha-200'] : theme['c-500']} numberOfLines={1}>
                      {singer}
                    </Text>
                  </View>
                )
          }
        </View>
        {
          !showPic && isShowInterval ? (
            <Text size={12} color={active ? theme['c-primary-alpha-400'] : theme['c-250']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
      </TouchableOpacity>
      {/* <View style={styles.listItemRight}> */}
      {
        showPic
          ? (
              <>
                {
                  showRemove
                    ? <TouchableOpacity style={styles.iconButton} onPress={() => { onRemoveItem?.(item, index) }}>
                        <PhIcon Icon={Trash} size={20} color={theme['c-350']} />
                      </TouchableOpacity>
                    : null
                }
                <TouchableOpacity style={styles.iconButton} onPress={handleToggleLove}>
                  <PhIcon
                    Icon={Heart}
                    size={20}
                    color={loved ? LOVED_HEART_COLOR : theme['c-350']}
                    weight={loved ? 'fill' : 'regular'}
                  />
                </TouchableOpacity>
              </>
            )
          : null
      }
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={showPic ? styles.iconButton : styles.moreButton}>
        <PhIcon Icon={DotsThreeVertical} size={showPic ? 20 : 12} color={theme['c-350']} />
      </TouchableOpacity>
      {/* </View> */}
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.showRemove === nextProps.showRemove &&
    prevProps.activeIndex != nextProps.index &&
    nextProps.activeIndex != nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(prevProps.item)
  )
})


const styles = createStyle({
  listItem: {
    // width: '50%',
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
    // 换成 PhIcon 后外层包 View，用 alignItems 让图标在 38 宽度内居中（与序号文字对齐）
    alignItems: 'center',
  },
  pic: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: 20,
    marginRight: 14,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    // paddingTop: 10,
    // paddingBottom: 10,
    paddingRight: 2,
  },
  // listItemTitle: {
  //   flexGrow: 0,
  //   flexShrink: 1,
  // },
  listItemSingle: {
    paddingTop: 3,
    flexDirection: 'row',
    // alignItems: 'flex-end',
  },
  listItemSingleText: {
    // backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
    // fontSize: 15,
    paddingTop: 3,
  },
  // listItemBadge: {
  //   // fontSize: 10,
  //   paddingLeft: 5,
  //   paddingTop: 2,
  //   alignSelf: 'flex-start',
  // },
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
  iconButton: {
    height: '100%',
    paddingLeft: 12,
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
