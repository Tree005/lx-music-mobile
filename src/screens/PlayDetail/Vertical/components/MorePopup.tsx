import { forwardRef, useImperativeHandle, useRef, useState, type ComponentType } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { ListPlus, SlidersHorizontal, TextAa, Timer, type IconProps } from 'phosphor-react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import playerState from '@/store/player/state'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { PRESS_OPACITY } from '@/theme/motion'

export interface MorePopupType {
  show: () => void
}

interface MoreItem {
  icon: ComponentType<IconProps>
  /** 文案（调用处用 t() 取好，支持动态状态文本） */
  label: string
  /** 图标颜色（缺省主题字色；桌面歌词用颜色区分开关状态） */
  color?: string
  onPress: () => void
}

export default forwardRef<MorePopupType, {}>((_, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  const musicAddModalRef = useRef<MusicAddModalType>(null)
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)
  const timeoutModalRef = useRef<TimeoutExitEditModalType>(null)
  const settingPopupRef = useRef<SettingPopupType>(null)
  const enabledLyric = useSettingValue('desktopLyric.enable')
  const timeInfo = useTimeInfo()

  // 添加当前播放的歌到歌单（改造播放页时删掉的功能，从上游 MusicAddBtn 搬回）
  const handleShowMusicAdd = () => {
    const playMusicInfo = playerState.playMusicInfo
    if (!playMusicInfo.musicInfo || !playMusicInfo.listId) return
    musicAddModalRef.current?.show({
      musicInfo: 'progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo,
      isMove: false,
      listId: playMusicInfo.listId,
    })
  }
  // 桌面歌词开关（复用 ToolsBar 的 DesktopLyricEnable，长按锁定的入口保留在播放页工具栏）
  const handleToggleDesktopLyric = () => {
    desktopLyricEnableRef.current?.setEnabled(!enabledLyric)
  }
  const handleShowTimeout = () => {
    timeoutModalRef.current?.show()
  }
  const handleShowSetting = () => {
    settingPopupRef.current?.show()
  }

  // 后续新增的「不常用功能」都往这个数组里加，弹层会自动渲染成列表
  const moreItems: MoreItem[] = [
    { icon: ListPlus, label: t('add_to'), onPress: handleShowMusicAdd },
    { icon: TextAa, label: t('play_detail_more_desktop_lyric'), color: enabledLyric ? theme['c-primary'] : undefined, onPress: handleToggleDesktopLyric },
    { icon: Timer, label: t('play_detail_more_timeout'), color: timeInfo.active ? theme['c-primary'] : undefined, onPress: handleShowTimeout },
    { icon: SlidersHorizontal, label: t('play_detail_more_setting'), onPress: handleShowSetting },
  ]

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          popupRef.current?.setVisible(true)
        })
      }
    },
  }))

  return (
    visible
      ? (
        <>
          <Popup ref={popupRef} title={t('play_detail_more_title')} slide>
            <ScrollView>
            <View style={styles.list} onStartShouldSetResponder={() => true}>
              {
                moreItems.length
                  ? moreItems.map(({ icon, label, color, onPress }, index) => (
                      <TouchableOpacity key={index} style={styles.item} activeOpacity={PRESS_OPACITY} onPress={() => {
                        popupRef.current?.setVisible(false)
                        onPress()
                      }}>
                        <PhIcon Icon={icon} size={20} color={color ?? theme['c-font']} />
                        <Text style={styles.itemText} size={15} color={theme['c-font']}>{label}</Text>
                      </TouchableOpacity>
                  ))
                  : <View style={styles.empty}>
                      <Text size={14} color={theme['c-font-label']}>{t('play_detail_more_empty')}</Text>
                    </View>
              }
              </View>
            </ScrollView>
          </Popup>
          <MusicAddModal ref={musicAddModalRef} />
          <DesktopLyricEnable ref={desktopLyricEnableRef} />
          <TimeoutExitEditModal ref={timeoutModalRef} timeInfo={timeInfo} />
          <SettingPopup ref={settingPopupRef} direction="vertical" />
        </>
        )
      : null
  )
})

const styles = createStyle({
  list: {
    paddingBottom: scaleSizeH(10),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(48),
    paddingHorizontal: scaleSizeW(20),
  },
  itemText: {
    marginLeft: scaleSizeW(12),
  },
  empty: {
    height: scaleSizeH(80),
    justifyContent: 'center',
    alignItems: 'center',
  },
})
