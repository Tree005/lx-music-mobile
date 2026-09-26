import { memo, type ComponentType } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ArrowsClockwise, Broom, CaretRight, CloudArrowUp, Gear, MusicNotes, type IconProps } from 'phosphor-react-native'

import Section from '../components/Section'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { scaleSizeH } from '@/utils/pixelRatio'
import { type SettingScreenIds } from '../Main'

// 主页入口行：图标 + 标题 +（可选副值）+ 右箭头
const Row = memo(({ icon, label, value, onPress }: {
  icon: ComponentType<IconProps>
  label: string
  value?: string
  onPress: () => void
}) => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <PhIcon Icon={icon} size={20} color={theme['c-primary']} style={styles.rowIcon} />
      <Text style={styles.rowLabel} size={15}>{label}</Text>
      {value ? <Text size={13} color={theme['c-font-label']} style={styles.rowValue}>{value}</Text> : null}
      <PhIcon Icon={CaretRight} size={14} color={theme['c-font-label']} />
    </TouchableOpacity>
  )
})

// 设置主页：仿参考图的两级结构，这里只放入口
export default ({ onOpenScreen, onOpenAppSettings }: {
  /** 打开某个设置分区 */
  onOpenScreen: (id: SettingScreenIds) => void
  /** 进入「应用设置」子页 */
  onOpenAppSettings: () => void
}) => {
  const t = useI18n()

  return (
    <View style={styles.container}>
      <Section title={t('setting_basic')}>
        <Row icon={CloudArrowUp} label={t('setting_sync')} onPress={() => { onOpenScreen('sync') }} />
        <Row icon={Gear} label={t('setting_app')} onPress={onOpenAppSettings} />
        <Row icon={MusicNotes} label={t('setting_basic_source')} onPress={() => { onOpenScreen('basic') }} />
      </Section>
      <Section title={t('setting_about')}>
        <Row icon={ArrowsClockwise} label={t('setting_version')} onPress={() => { onOpenScreen('version') }} />
        <Row icon={Broom} label={t('setting_cache')} onPress={() => { onOpenScreen('other') }} />
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
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    marginRight: 6,
  },
})
