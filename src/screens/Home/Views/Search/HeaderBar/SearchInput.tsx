import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View } from 'react-native'
import { MagnifyingGlass } from 'phosphor-react-native'
import Input, { type InputType, type InputProps } from '@/components/common/Input'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

// 胶囊底色固定不跟随主题（与首页搜索框一致，切主题时保持同一个浅色底）
const BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.05)'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    setText(text) {
      setText(text)
    },
    getText() {
      return text.trim()
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (text: string) => {
    setText(text)
    onChangeText(text.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback<NonNullable<InputProps['onSubmitEditing']>>(({ nativeEvent: { text } }) => {
    onSubmit(text)
  }, [onSubmit])

  return (
    // 浅色胶囊 + 左侧放大镜，与首页搜索框观感连续（对齐网易云顶栏形态）
    <View style={{ ...styles.container, backgroundColor: BACKGROUND_COLOR }}>
      <PhIcon Icon={MagnifyingGlass} size={16} color={theme['c-font-label']} />
      <Input
        ref={inputRef}
        placeholder={t('home_search_tip')}
        placeholderTextColor={theme['c-font-label']}
        value={text}
        onChangeText={handleChangeText}
        style={styles.input}
        onBlur={onBlur}
        onSubmitEditing={handleSubmit}
        onClearText={handleClearText}
        onTouchStart={onTouchStart}
        clearBtn
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 17,
    paddingLeft: 10,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 6,
    paddingRight: 0,
  },
})
