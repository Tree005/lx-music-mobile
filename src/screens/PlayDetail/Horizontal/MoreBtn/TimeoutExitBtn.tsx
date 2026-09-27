import { memo, useRef } from 'react'
import { Timer } from 'phosphor-react-native'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import Btn from './Btn'

// 整页是暗色模糊底，图标用白色；定时开启时点亮为纯白，未开启时半透明白
const ACTIVE_COLOR = '#fff'
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.6)'


export default memo(() => {
  const modalRef = useRef<TimeoutExitEditModalType>(null)

  const timeInfo = useTimeInfo()

  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <>
      <Btn icon={Timer} color={timeInfo.active ? ACTIVE_COLOR : INACTIVE_COLOR} onPress={handleShow} />
      <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} />
    </>
  )
})
