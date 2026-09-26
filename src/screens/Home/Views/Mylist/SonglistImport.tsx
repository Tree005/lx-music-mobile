import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { CaretLeft, CaretRight, MusicNotes, X } from 'phosphor-react-native'

import Modal, { type ModalType } from '@/components/common/Modal'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useKeyboard } from '@/utils/hooks'
import { scaleSizeH } from '@/utils/pixelRatio'

// 导入外部歌单的平台（用参考图里的化名，顺序也照参考图）
const PLATFORMS = [
  { id: 'wy', labelKey: 'songlist_platform_wy', descKey: 'songlist_import_desc_link' },
  { id: 'kw', labelKey: 'songlist_platform_kw', descKey: 'songlist_import_desc_link' },
  { id: 'tx', labelKey: 'songlist_platform_tx', descKey: 'songlist_import_desc_link' },
  { id: 'kg', labelKey: 'songlist_platform_kg', descKey: 'songlist_import_desc_link_or_code' },
  { id: 'mg', labelKey: 'songlist_platform_mg', descKey: 'songlist_import_desc_link' },
] as const

type Platform = typeof PLATFORMS[number]

export interface SonglistImportType {
  show: () => void
}

// 导入歌单弹层：第一步选平台，第二步粘贴歌单链接
// 导入动作还没实现（当前只做流程与布局）
export default forwardRef<SonglistImportType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const modalRef = useRef<ModalType>(null)
  // null 表示还在「选择音乐平台」这一步
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [link, setLink] = useState('')
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show() {
      setVisible(true)
      setLink('')
      setPlatform(null)
      modalRef.current?.setVisible(true)
    },
  }), [])

  const hide = useCallback(() => {
    modalRef.current?.setVisible(false)
  }, [])

  const handleBack = useCallback(() => {
    setLink('')
    setPlatform(null)
  }, [])

  if (!visible) return null

  return (
    <Modal bgColor="rgba(50,50,50,.3)" ref={modalRef}>
      <View style={{ ...styles.mask, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View
          style={{ ...styles.sheet, backgroundColor: theme['c-content-background'] }}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            {
              platform
                ? <TouchableOpacity style={styles.headerBtn} onPress={handleBack}>
                    <PhIcon Icon={CaretLeft} size={20} color={theme['c-font']} />
                  </TouchableOpacity>
                : <View style={styles.headerBtn} />
            }
            <Text style={styles.headerTitle} size={17} numberOfLines={1}>
              {platform ? t('songlist_import_title', { name: t(platform.labelKey) }) : t('songlist_import')}
            </Text>
            <TouchableOpacity style={styles.headerBtn} onPress={hide}>
              <PhIcon Icon={X} size={20} color={theme['c-font']} />
            </TouchableOpacity>
          </View>
          {
            platform
              ? (
                  <View style={styles.body}>
                    <TextInput
                      value={link}
                      onChangeText={setLink}
                      placeholder={t('songlist_import_placeholder', { name: t(platform.labelKey) })}
                      placeholderTextColor={theme['c-font-label']}
                      multiline
                      textAlignVertical="top"
                      style={{
                        ...styles.linkInput,
                        color: theme['c-font'],
                        borderColor: theme['c-border-background'],
                      }}
                    />
                    <View style={styles.btns}>
                      <Button style={{ ...styles.btn, ...styles.btnLeft, backgroundColor: theme['c-050'] }} onPress={handleBack}>
                        <Text size={16} color={theme['c-font']}>{t('back')}</Text>
                      </Button>
                      {/* 导入动作待实现，先只给按钮 */}
                      <Button style={{ ...styles.btn, backgroundColor: theme['c-font'] }}>
                        <Text size={16} color={theme['c-content-background']}>{t('list_import')}</Text>
                      </Button>
                    </View>
                  </View>
                )
              : (
                  <ScrollView style={styles.body} keyboardShouldPersistTaps={'always'}>
                    <Text style={styles.sectionTitle} size={17}>{t('songlist_import_select_platform')}</Text>
                    {
                      PLATFORMS.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={{ ...styles.platformItem, backgroundColor: theme['c-050'] }}
                          activeOpacity={0.7}
                          onPress={() => { setPlatform(item) }}
                        >
                          <PhIcon Icon={MusicNotes} size={26} color={theme['c-primary']} weight="fill" />
                          <View style={styles.platformInfo}>
                            <Text size={16} style={styles.platformName}>{t(item.labelKey)}</Text>
                            <Text size={13} color={theme['c-font-label']} style={styles.platformDesc}>{t(item.descKey)}</Text>
                          </View>
                          <PhIcon Icon={CaretRight} size={16} color={theme['c-font-label']} />
                        </TouchableOpacity>
                      ))
                    }
                  </ScrollView>
                )
          }
        </View>
      </View>
    </Modal>
  )
})


const styles = createStyle({
  mask: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(56),
  },
  headerBtn: {
    width: 56,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  body: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    paddingTop: 10,
    paddingBottom: 12,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingLeft: 18,
    paddingRight: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 20,
  },
  platformInfo: {
    flex: 1,
    paddingLeft: 16,
  },
  platformName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  platformDesc: {
    // 平台说明
  },
  linkInput: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  btns: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLeft: {
    marginRight: 16,
  },
})
