import { memo } from 'react'

import { View } from 'react-native'

import CheckBox, { type CheckBoxProps } from '@/components/common/CheckBox'
import { createStyle } from '@/utils/tools'


export default memo((props: CheckBoxProps) => {
  return (
    <View style={styles.container}>
      <CheckBox {...props} />
    </View>
  )
})

const styles = createStyle({
  container: {
    // FlatList 已提供 15 的左右内边距，这里各补 5，使设置项左右内边距约 20
    paddingLeft: 5,
    paddingRight: 5,
    // 单行高度约 52，靠留白区分各行，不使用分隔线
    minHeight: 52,
    justifyContent: 'center',
  },
})

