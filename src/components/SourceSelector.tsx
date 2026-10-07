import { forwardRef, type Ref, useImperativeHandle, useMemo, useState } from 'react'
import { View } from 'react-native'

import DorpDownMenu, { type DorpDownMenuProps as _DorpDownMenuProps } from '@/components/common/DorpDownMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  center?: _DorpDownMenuProps<any>['center']
  /** 圆形按钮形态（只显示源名前两字，点击弹同样的下拉），用于搜索页顶栏等紧凑布局 */
  circle?: boolean
  onSourceChange: (source: S[number]) => void
}

export interface SourceSelectorType<S extends Sources> {
  setSourceList: (list: S, activeSource: S[number]) => void
}

export const useSourceListI18n = (list: Sources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_${sourceNameType}_${s}`), action: s }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sourceNameType, t])
}

const Component = <S extends Sources>({ fontSize = 15, center, circle = false, onSourceChange }: SourceSelectorProps<S>, ref: Ref<SourceSelectorType<S>>) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [list, setList] = useState([] as unknown as S)
  const [source, setSource] = useState<S[number]>('kw')
  const theme = useTheme()
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setSourceList(list, activeSource) {
      setList(list)
      setSource(activeSource)
    },
  }), [])

  const sourceList_t = useSourceListI18n(list)

  type DorpDownMenuProps = _DorpDownMenuProps<typeof sourceList_t>

  const handleChangeSource: DorpDownMenuProps['onPress'] = ({ action }) => {
    onSourceChange(action)
    setSource(action)
  }

  return (
    <DorpDownMenu
      menus={sourceList_t}
      center={center}
      onPress={handleChangeSource}
      fontSize={fontSize}
      activeId={source}
      menuMinWidth={90}
    >
      {
        circle
          ? (
              <View style={{ ...styles.sourceCircle, backgroundColor: theme['c-button-background'] }}>
                <Text style={styles.circleText} numberOfLines={1} size={11}>{t(`source_${sourceNameType}_${source}`).slice(0, 2)}</Text>
              </View>
            )
          : (
              <View style={styles.sourceMenu}>
                <Text style={{ textAlign: center ? 'center' : 'left' }} numberOfLines={1} size={fontSize}>{t(`source_${sourceNameType}_${source}`)}</Text>
              </View>
            )
      }
    </DorpDownMenu>
  )
}

export default forwardRef(Component) as <S extends Sources>(p: SourceSelectorProps<S> & { ref?: Ref<SourceSelectorType<S>> }) => JSX.Element | null


const styles = createStyle({
  sourceMenu: {
    height: '100%',
    justifyContent: 'center',
    // paddingTop: 12,
    // paddingBottom: 12,
    paddingLeft: 15,
    paddingRight: 15,
    // backgroundColor: '#ccc',

  },
  sourceCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    textAlign: 'center',
  },
})
