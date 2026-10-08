import { memo, useCallback, useMemo, useRef } from 'react'

import { ScrollView, TouchableOpacity } from 'react-native'
import { CaretRight, Check } from 'phosphor-react-native'

import Popup, { type PopupType } from '@/components/common/Popup'
import { useTheme } from '@/store/theme/hook'
import { PRESS_OPACITY } from '@/theme/motion'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'

export interface SelectItemOption<V extends string = string> {
  value: V
  label: string
}

interface Props<V extends string = string> {
  /** 行标题（也是弹层标题的默认值） */
  label: string
  /** 当前选中值 */
  value: V
  options: ReadonlyArray<SelectItemOption<V>>
  onChange: (value: V) => void
  /** 弹层标题（默认取 label） */
  pickerTitle?: string
  disabled?: boolean
}

// 选择型设置行（网易云式交互）：行显示「标题 + 当前值 + 箭头」，点开底部弹层再选，当前项右侧打勾。
// 取代旧的「行内铺开、左侧勾选」列表（语言/字体大小/音质/分享类型/来源名称/添加位置等）
function SelectItem<V extends string>({ label, value, options, onChange, pickerTitle, disabled = false }: Props<V>) {
  const theme = useTheme()
  const popupRef = useRef<PopupType>(null)
  const currentLabel = useMemo(() => options.find(o => o.value === value)?.label ?? '', [options, value])

  const handlePress = useCallback(() => { popupRef.current?.setVisible(true) }, [])
  const handleSelect = useCallback((v: V) => {
    onChange(v)
    popupRef.current?.setVisible(false)
  }, [onChange])

  return (
    <>
      <TouchableOpacity style={styles.row} activeOpacity={PRESS_OPACITY} disabled={disabled} onPress={handlePress}>
        <Text style={styles.label} size={15}>{label}</Text>
        <Text style={styles.value} size={13} color={theme['c-font-label']} numberOfLines={1}>{currentLabel}</Text>
        <PhIcon Icon={CaretRight} size={14} color={theme['c-font-label']} />
      </TouchableOpacity>
      <Popup ref={popupRef} title={pickerTitle ?? label} slide>
        <ScrollView keyboardShouldPersistTaps={'always'}>
          {
            options.map(o => {
              const active = o.value === value
              return (
                <TouchableOpacity
                  key={o.value}
                  style={styles.option}
                  activeOpacity={PRESS_OPACITY}
                  onPress={() => { handleSelect(o.value) }}
                >
                  <Text style={styles.optionLabel} size={15} color={active ? theme['c-primary'] : theme['c-font']}>{o.label}</Text>
                  {active ? <PhIcon Icon={Check} size={16} color={theme['c-primary']} /> : null}
                </TouchableOpacity>
              )
            })
          }
        </ScrollView>
      </Popup>
    </>
  )
}

export default memo(SelectItem) as typeof SelectItem

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // 与开关行（CheckBoxItem）同规格的单行高度
    minHeight: 56,
    paddingHorizontal: 20,
  },
  label: {
    flex: 1,
    // 长标题与右侧当前值之间留间距
    marginRight: 12,
  },
  value: {
    marginRight: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: 20,
  },
  optionLabel: {
    flex: 1,
    marginRight: 12,
  },
})
