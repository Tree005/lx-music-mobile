import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSourceListI18n } from '@/components/SourceSelector'

const SOURCES: LX.OnlineSource[] = ['kw', 'kg', 'wy', 'tx', 'mg']

const useActive = (id: LX.OnlineSource | '') => {
  const source = useSettingValue('player.playPrioritySource')
  const isActive = useMemo(() => source == id, [source, id])
  return isActive
}

const Item = ({ id, name }: {
  id: LX.OnlineSource | ''
  name: string
}) => {
  const isActive = useActive(id)
  return <CheckBox marginRight={8} check={isActive} label={name} onChange={() => { updateSetting({ 'player.playPrioritySource': id }) }} need />
}

export default memo(() => {
  const t = useI18n()
  const sourceNames = useSourceListI18n(SOURCES)

  return (
    <SubTitle title={t('setting_play_priority_source')}>
      <View style={styles.list}>
        <Item id={''} name={t('setting_play_priority_source_off')} />
        {
          sourceNames.map(({ label, action }) => <Item id={action as LX.OnlineSource} name={label} key={action} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
