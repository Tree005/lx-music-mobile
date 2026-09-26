import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { TextInput, View } from 'react-native'

import Dialog, { type DialogType } from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { createUserList, updateUserList } from '@/core/list'
import { confirmDialog, createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeH, setSpText } from '@/utils/pixelRatio'
import listState from '@/store/list/state'

interface NameInputType {
  setName: (text: string) => void
  getText: () => string
  focus: () => void
}

const NameInput = forwardRef<NameInputType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setName(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <TextInput
      ref={inputRef}
      autoCapitalize="none"
      autoComplete="off"
      placeholder={t('songlist_create_placeholder')}
      placeholderTextColor={theme['c-font-label']}
      selectionColor={theme['c-primary-light-100-alpha-300']}
      value={text}
      onChangeText={setText}
      style={{
        ...styles.input,
        color: theme['c-font'],
        borderColor: theme['c-border-background'],
      }}
    />
  )
})


export interface ListNameEditType {
  showCreate: (position: number) => void
  show: (listInfo: LX.List.UserListInfo) => void
}

const initSelectInfo = {}


// 新建 / 重命名歌单弹窗：居中卡片（无关闭按钮），对齐参考图
export default forwardRef<ListNameEditType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const dialogRef = useRef<DialogType>(null)
  const nameInputRef = useRef<NameInputType>(null)
  const [position, setPosition] = useState(0)
  const selectedListInfo = useRef<LX.List.UserListInfo>(initSelectInfo as LX.List.UserListInfo)
  const [visible, setVisible] = useState(false)

  const handleShow = (name: string) => {
    dialogRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      nameInputRef.current?.setName(name)
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 300)
    })
  }

  useImperativeHandle(ref, () => ({
    showCreate(position) {
      setPosition(position)
      if (visible) handleShow('')
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow('')
        })
      }
    },
    show(listInfo) {
      setPosition(-1)
      selectedListInfo.current = listInfo
      if (visible) handleShow(listInfo.name ?? '')
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(listInfo.name ?? '')
        })
      }
    },
  }))

  const handleCancel = () => {
    dialogRef.current?.setVisible(false)
  }

  const handleConfirm = () => {
    let name = nameInputRef.current?.getText() ?? ''
    if (!name.length) return
    if (name.length > 100) name = name.substring(0, 100)
    if (position == -1) {
      void updateUserList([{ ...selectedListInfo.current, name }])
    } else {
      void (listState.userList.some(l => l.name == name) ? confirmDialog({
        message: global.i18n.t('list_duplicate_tip'),
      }) : Promise.resolve(true)).then(confirmed => {
        if (!confirmed) return
        const now = Date.now()
        void createUserList(position, [{ id: `userlist_${now}`, name, locationUpdateTime: now }])
      })
    }
    dialogRef.current?.setVisible(false)
  }

  return (
    visible
      ? <Dialog ref={dialogRef} closeBtn={false}>
          <View style={styles.content}>
            <Text style={styles.title} size={17}>{position == -1 ? t('list_rename_title') : t('songlist_create')}</Text>
            <NameInput ref={nameInputRef} />
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, ...styles.btnLeft, backgroundColor: theme['c-050'] }} onPress={handleCancel}>
                <Text size={16} color={theme['c-font']}>{t('cancel')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-font'] }} onPress={handleConfirm}>
                <Text size={16} color={theme['c-content-background']}>{position == -1 ? t('confirm') : t('songlist_create_btn')}</Text>
              </Button>
            </View>
          </View>
        </Dialog>
      : null
  )
})


const styles = createStyle({
  content: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 18,
  },
  input: {
    height: scaleSizeH(52),
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: setSpText(15),
  },
  btns: {
    flexDirection: 'row',
    marginTop: 20,
  },
  btn: {
    flex: 1,
    height: scaleSizeH(52),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLeft: {
    marginRight: 16,
  },
})
