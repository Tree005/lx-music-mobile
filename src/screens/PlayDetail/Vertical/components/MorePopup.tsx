import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { type ComponentType } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { type IconProps } from 'phosphor-react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { useTheme } from '@/store/theme/hook'
import { useI18n, type Message } from '@/lang'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

export interface MorePopupType {
  show: () => void
}

interface MoreItem {
  icon: ComponentType<IconProps>
  /** i18n key */
  label: keyof Message
  onPress: () => void
}

// 后续新增的「不常用功能」都往这个数组里加，弹层会自动渲染成列表
const moreItems: MoreItem[] = []

export default forwardRef<MorePopupType, {}>((_, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)

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
        <Popup ref={popupRef} title={t('play_detail_more_title')}>
          <ScrollView>
            <View style={styles.list} onStartShouldSetResponder={() => true}>
              {
                moreItems.length
                  ? moreItems.map(({ icon, label, onPress }, index) => (
                      <TouchableOpacity key={index} style={styles.item} activeOpacity={0.6} onPress={() => {
                        popupRef.current?.setVisible(false)
                        onPress()
                      }}>
                        <PhIcon Icon={icon} size={20} color={theme['c-font']} />
                        <Text style={styles.itemText} size={15} color={theme['c-font']}>{t(label)}</Text>
                      </TouchableOpacity>
                  ))
                  : <View style={styles.empty}>
                      <Text size={14} color={theme['c-font-label']}>{t('play_detail_more_empty')}</Text>
                    </View>
              }
            </View>
          </ScrollView>
        </Popup>
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
