// import { useLrcPlay } from '@/plugins/lyric'
import { useStatusText } from '@/store/player/hook'
// import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

// 整页是暗色模糊底，状态文字用半透明白
const STATUS_COLOR = 'rgba(255, 255, 255, 0.7)'

export default () => {
  // const { text } = useLrcPlay()
  const statusText = useStatusText()
  // console.log('render status')

  // const status = playerStatus.isPlay ? text : playerStatus.statusText

  return <Text numberOfLines={1} size={13} color={STATUS_COLOR}>{statusText}</Text>
}

// const styles = createStyle({
//   text: {
//     fontSize: 10,
//   },
// })
