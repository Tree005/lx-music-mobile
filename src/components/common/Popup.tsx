import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Animated, View, TouchableOpacity } from 'react-native'

import Modal, { type ModalType } from './Modal'
import { X } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { useStatusbarHeight } from '@/store/common/hook'
import { DURATION, EASING, SHEET_SLIDE_OFFSET, SPRING } from '@/theme/motion'

const styles = createStyle({
  centeredView: {
    flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'center',
  },
  modalView: {
    elevation: 6,
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    flex: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    paddingLeft: 10,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 10,
    // lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    // borderTopRightRadius: 8,
    flexGrow: 0,
    flexShrink: 0,
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#eee',
  },
})

export interface PopupProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  position?: 'top' | 'left' | 'right' | 'bottom'
  title?: string
  /** 底部弹层滑入动画（spring；仅 position='bottom' 生效，默认关闭——存量弹层维持 fade） */
  slide?: boolean
  children: React.ReactNode
}

export interface PopupType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<PopupType, PopupProps>(({
  onHide = () => {},
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  position = 'bottom',
  title = '',
  slide = false,
  children,
}: PopupProps, ref) => {
  const theme = useTheme()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const statusBarHeight = useStatusbarHeight()

  const modalRef = useRef<ModalType>(null)
  // slide 动画值：0=藏于屏幕下方，1=就位。仅在 setVisible(true) 时 spring 滑入；
  // 隐藏时 Modal 自身 fade 的同时滑回下方，背景变暗与滑出同步
  const slideAnim = useRef(new Animated.Value(0)).current
  const slideEnabled = slide && position === 'bottom'
  const slideTransform = slideEnabled
    ? [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_SLIDE_OFFSET, 0] }) }]
    : []

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      if (slideEnabled) {
        if (visible) {
          slideAnim.setValue(0)
          Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, ...SPRING.sheet }).start()
        } else {
          Animated.timing(slideAnim, { toValue: 0, duration: DURATION.base, easing: EASING.standard, useNativeDriver: true }).start()
        }
      }
      modalRef.current?.setVisible(visible)
    },
  }))

  const closeBtnComponent = useMemo(() => closeBtn
    ? <TouchableOpacity style={styles.closeBtn} onPress={() => modalRef.current?.setVisible(false)}>
        <PhIcon Icon={X} color={theme['c-font-label']} size={12} />
      </TouchableOpacity>
    : null, [closeBtn, theme])

  const [centeredViewStyle, modalViewStyle] = useMemo(() => {
    switch (position) {
      case 'top':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'flex-start',
          },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            // backgroundColor: 'white',
          },
        ] as const
      case 'left':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            paddingTop: statusBarHeight,
            // backgroundColor: 'white',
          },
        ] as const
      case 'right':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            paddingTop: statusBarHeight,
            // backgroundColor: 'white',
          },
        ] as const
      case 'bottom':
      default:
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'flex-end',
          },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            // backgroundColor: 'white',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ] as const
    }
  }, [position, statusBarHeight])

  return (
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(50,50,50,.2)" ref={modalRef}>
      <View style={{ ...styles.centeredView, ...centeredViewStyle, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <Animated.View style={{ ...styles.modalView, ...modalViewStyle, backgroundColor: theme['c-content-background'], transform: slideTransform }} onStartShouldSetResponder={() => true}>
          {/* 无标题且无关闭钮时不渲染 header（bare 模式：调用方自带头部，如播放队列/导入歌单） */}
          {(title !== '' || closeBtn)
            ? (
                <View style={styles.header}>
                  <Text size={13} style={styles.title} numberOfLines={1}>{title}</Text>
                  {closeBtnComponent}
                </View>
              )
            : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
})
