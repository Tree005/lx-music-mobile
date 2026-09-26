import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { CaretLeft } from 'phosphor-react-native'

import ButtonBar from './ActionBar'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { pop, useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useListInfo } from './state'

const IMAGE_WIDTH = scaleSizeW(100)

const Pic = ({ componentId, imgUrl }: {
  componentId: string
  imgUrl?: string
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  useEffect(() => {
    if (animated) setPic(imgUrl)
  }, [imgUrl, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  return (
    <View style={{ ...styles.picWrap, width: IMAGE_WIDTH, height: IMAGE_WIDTH }}>
      <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`} url={pic} style={styles.pic} />
    </View>
  )
}

export interface HeaderProps {
  componentId: string
}

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
}
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

// 头部：返回箭头 + 封面 + 歌单名 + 歌单描述（对齐参考图，播放量角标已去掉）
export default forwardRef<HeaderType, HeaderProps>(({ componentId }: { componentId: string }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info.img })

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  return (
    <View style={{ ...styles.container, paddingTop: statusBarHeight, backgroundColor: theme['c-content-background'] }}>
      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backBtn} onPress={back}>
          <PhIcon Icon={CaretLeft} size={22} color={theme['c-font']} />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Pic componentId={componentId} imgUrl={detailInfo.imgUrl} />
        <View style={styles.infoText} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text style={styles.name} size={22} numberOfLines={2}>{detailInfo.name}</Text>
          <Text style={styles.desc} size={14} color={theme['c-font-label']} numberOfLines={4}>{detailInfo.desc}</Text>
        </View>
      </View>
      <ButtonBar />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  backRow: {
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
    paddingTop: 4,
    paddingBottom: 20,
  },
  picWrap: {
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
  pic: {
    flex: 1,
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
  },
  desc: {
    marginTop: 10,
  },
})
