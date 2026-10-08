import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { CaretRight } from 'phosphor-react-native'

import Section from '../components/Section'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { scaleSizeH } from '@/utils/pixelRatio'
import { type SettingPageIds } from './index'

// 主页入口行：标题 +（可选副值）+ 右箭头，纯文字不带图标
const Row = memo(({ label, value, onPress }: {
  label: string
  value?: string
  onPress: () => void
}) => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.rowLabel} size={15}>{label}</Text>
      {value ? <Text size={13} color={theme['c-font-label']} style={styles.rowValue}>{value}</Text> : null}
      <PhIcon Icon={CaretRight} size={14} color={theme['c-font-label']} />
    </TouchableOpacity>
  )
})

// 设置主页：单卡片 7 个一级入口，点进去是各个二级页
export default ({ onOpenPage }: {
  /** 打开某个入口对应的二级页 */
  onOpenPage: (id: SettingPageIds) => void
}) => {
  const t = useI18n()

  return (
    <View style={styles.container}>
      <Section>
        <Row label={t('setting_player')} onPress={() => { onOpenPage('play') }} />
        <Row label={t('setting_display_lyric')} onPress={() => { onOpenPage('display') }} />
        <Row label={t('setting_list')} onPress={() => { onOpenPage('list') }} />
        <Row label={t('setting_sync')} onPress={() => { onOpenPage('sync') }} />
        <Row label={t('setting_backup')} onPress={() => { onOpenPage('backup') }} />
        <Row label={t('setting_basic_source')} onPress={() => { onOpenPage('source') }} />
        <Row label={t('setting_cache_update')} onPress={() => { onOpenPage('update') }} />
      </Section>
    </View>
  )
}


const styles = createStyle({
  container: {
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(56),
    paddingLeft: 20,
    paddingRight: 20,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    marginRight: 6,
  },
})
