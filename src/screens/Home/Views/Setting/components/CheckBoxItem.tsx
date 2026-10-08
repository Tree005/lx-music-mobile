import { memo, useCallback, useMemo } from 'react'

import { TouchableOpacity, View } from 'react-native'
import { Question } from 'phosphor-react-native'

import Switch from './Switch'
import { PRESS_OPACITY } from '@/theme/motion'
import { createStyle, tipDialog } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'

interface Props {
  check: boolean
  onChange: (check: boolean) => void
  label?: string
  children?: React.ReactNode
  disabled?: boolean
  /** 必须保持开启：开启后不可再取消（等同 disabled） */
  need?: boolean
  size?: number
  marginBottom?: number
  /** 帮助弹窗标题 / 正文，有其一即显示「?」图标 */
  helpTitle?: string
  helpDesc?: string
  /** 标题下方的说明灰字 */
  desc?: string
}

// 设置页「开 / 关」通用行：左侧文本（点击整行切换）+「?」帮助图标，右侧滑动开关
export default memo(({
  check, onChange, label, children, disabled = false, need = false,
  size = 1, marginBottom, helpTitle, helpDesc, desc,
}: Props) => {
  const theme = useTheme()
  // need 且已开启时不可取消，等同 disabled
  const isDisabled = disabled || (need && check)

  const handleSwitch = useCallback(() => {
    onChange(!check)
  }, [onChange, check])

  // 「?」帮助图标：点击弹帮助弹窗（标题 / 正文有一即显示），位置在文本和开关之间
  const helpComponent = useMemo(() => {
    const handleShowHelp = () => {
      void tipDialog({
        title: helpTitle ?? '',
        message: helpDesc,
        btnText: global.i18n.t('understand'),
      })
    }
    return (helpTitle ?? helpDesc)
      ? (
          <TouchableOpacity style={styles.helpBtn} onPress={handleShowHelp}>
            <PhIcon Icon={Question} size={15 * size} />
          </TouchableOpacity>
        )
      : null
  }, [helpTitle, helpDesc, size])

  return (
    <View style={[styles.container, marginBottom ? { marginBottom: scaleSizeH(marginBottom) } : null]}>
      <TouchableOpacity
        style={styles.main}
        activeOpacity={PRESS_OPACITY}
        disabled={isDisabled}
        onPress={handleSwitch}
      >
        <View style={styles.labelCol}>
          {label ? <Text size={15}>{label}</Text> : children}
          {desc ? <Text style={styles.desc} size={12} color={theme['c-font-label']}>{desc}</Text> : null}
        </View>
        {helpComponent}
      </TouchableOpacity>
      <Switch value={check} onValueChange={onChange} disabled={isDisabled} size={size} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // 单行约 56 高；有 desc 时由内容自然撑高
    minHeight: 56,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCol: {
    flex: 1,
    // 长标题与右侧开关之间留出间距
    marginRight: 12,
  },
  desc: {
    marginTop: 2,
  },
  helpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
})
