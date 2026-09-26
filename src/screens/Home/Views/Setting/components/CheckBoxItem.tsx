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
    // 分组标题的通栏灰底由 Section 负责，这里与标题文字左对齐（同为 20）
    paddingLeft: 20,
    paddingRight: 20,
    // 单行高度约 56，靠留白区分各行，不使用分隔线
    minHeight: 56,
    justifyContent: 'center',
  },
})
