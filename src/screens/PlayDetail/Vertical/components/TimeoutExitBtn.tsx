import { memo, useRef } from 'react'
import { Timer } from 'phosphor-react-native'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import Btn from './Btn'

// 整页是暗色模糊底，图标固定白色系（开启时纯白，未开启降透明度）
export const ICON_ON = '#fff'
export const ICON_OFF = 'rgba(255, 255, 255, 0.55)'

export default memo(() => {
  const modalRef = useRef<TimeoutExitEditModalType>(null)

  const timeInfo = useTimeInfo()

  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <>
      <Btn icon={Timer} color={timeInfo.active ? ICON_ON : ICON_OFF} onPress={handleShow} />
      <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} />
    </>
  )
})
