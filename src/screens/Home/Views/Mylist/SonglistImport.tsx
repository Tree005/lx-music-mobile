import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import { X } from 'phosphor-react-native'

import Modal, { type ModalType } from '@/components/common/Modal'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle, toMD5, toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useKeyboard } from '@/utils/hooks'
import { createList } from '@/core/list'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import listState from '@/store/list/state'
import { scaleSizeH } from '@/utils/pixelRatio'
import { BorderRadius } from '@/theme'

// 各平台歌单域名，用来从链接识别平台（纯歌单 ID 没有域名，识别不出来）
const SOURCE_DOMAINS: Record<string, LX.OnlineSource> = {
  'music.163.com': 'wy',
  '163cn.tv': 'wy',
  'y.qq.com': 'tx',
  'kuwo.cn': 'kw',
  'kugou.com': 'kg',
  'migu.cn': 'mg',
}

export const detectSource = (text: string): LX.OnlineSource | undefined => {
  const url = getSonglistLink(text)
  if (!url) return undefined
  const host = /^https?:\/\/([^/?#]+)/i.exec(url)?.[1]?.toLowerCase()
  if (!host) return undefined
  const domain = host.replace(/^(www\.|m\.)/, '')
  for (const [key, source] of Object.entries(SOURCE_DOMAINS)) {
    if (domain == key || domain.endsWith(`.${key}`)) return source
  }
  return undefined
}

// 分享文案里链接不一定在开头（「分享xxx的歌单「歌单名」: 链接 (来自@网易云音乐)」），
// 所以从整段文本里抽第一个链接，遇到空白/中文/成对括号就截断
const LINK_REGEX = /https?:\/\/[^\s\u4e00-\u9fa5()（）「」【】，。；：！？、]+/i

export const getSonglistLink = (text: string) => LINK_REGEX.exec(text)?.[0]

export interface SonglistImportType {
  show: () => void
}

// 导入外部歌单：粘贴歌单链接 → 按域名识别平台 → 拉全部歌曲，在我的歌单里建一个本地歌单
// 识别不出平台时给提示（不支持只填歌单 ID）
export default forwardRef<SonglistImportType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const modalRef = useRef<ModalType>(null)
  const inputRef = useRef<TextInput>(null)
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show() {
      setVisible(true)
      setText('')
      setImporting(false)
      modalRef.current?.setVisible(true)
      // 弹层动画结束后聚焦输入框，方便直接粘贴
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    },
  }), [])

  const hide = useCallback(() => {
    modalRef.current?.setVisible(false)
  }, [])

  const handleImport = useCallback(() => {
    const sourceListId = getSonglistLink(text)
    const source = detectSource(text)
    // 认不出链接/平台时给提示（不支持只填歌单 ID）
    if (!sourceListId || !source) {
      toast(t('songlist_import_link_invalid'))
      return
    }
    if (listState.userList.some(l => l.sourceListId == sourceListId)) {
      toast(t('songlist_import_exists'))
      return
    }

    setImporting(true)
    void (async() => {
      try {
        // 先取歌单信息（名字），再拉全部歌曲
        const detail = await getListDetail(sourceListId, source, 1)
        const list = await getListDetailAll(source, sourceListId)
        if (!list.length) throw new Error('empty list')
        await createList({
          name: detail.info?.name ?? t('songlist_import'),
          // 与「收藏歌单」用同一套 id 规则
          id: `${source}_${toMD5(`${source}__${sourceListId}`)}`,
          list,
          source,
          sourceListId,
        })
        toast(t('songlist_import_success'))
        hide()
      } catch (err) {
        toast(t('songlist_import_failed'))
      } finally {
        setImporting(false)
      }
    })()
  }, [text, t, hide])

  if (!visible) return null

  return (
    <Modal bgColor="rgba(50,50,50,.3)" ref={modalRef}>
      <View style={{ ...styles.mask, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View
          style={{ ...styles.sheet, backgroundColor: theme['c-content-background'] }}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={styles.headerBtn} />
            <Text style={styles.headerTitle} size={17} numberOfLines={1}>{t('songlist_import')}</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={hide}>
              <PhIcon Icon={X} size={20} color={theme['c-font']} />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={t('songlist_import_link_placeholder')}
              placeholderTextColor={theme['c-font-label']}
              multiline
              textAlignVertical="top"
              style={{
                ...styles.linkInput,
                color: theme['c-font'],
                borderColor: theme['c-border-background'],
              }}
            />
            <Text style={styles.tip} size={12} color={theme['c-font-label']}>{t('songlist_import_tip')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, ...styles.btnLeft, backgroundColor: theme['c-050'] }} onPress={hide}>
                <Text size={16} color={theme['c-font']}>{t('cancel')}</Text>
              </Button>
              <Button
                style={{ ...styles.btn, backgroundColor: theme['c-font'] }}
                disabled={importing}
                onPress={handleImport}
              >
                <Text size={16} color={theme['c-content-background']}>
                  {importing ? t('loading') : t('list_import')}
                </Text>
              </Button>
            </View>
          </View>
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
  linkInput: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    padding: 12,
    fontSize: 15,
  },
  tip: {
    paddingTop: 10,
  },
  btns: {
    flexDirection: 'row',
    paddingTop: 18,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLeft: {
    marginRight: 16,
  },
})
