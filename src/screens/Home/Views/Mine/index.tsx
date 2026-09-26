import { type ComponentType } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { confirmDialog, createStyle } from '@/utils/tools'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { Gear, Heart, SignOut, type IconProps } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'

// NAV_ENTRIES 里的 icon 仍是 MCI 名，这里映射到 Phosphor 组件
const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  'heart-outline': Heart,
  'cog-outline': Gear,
  logout: SignOut,
}

// 宫格里的导航入口（as const 保证 labelKey 是字面量类型，能被 t() 接受）
const NAV_ENTRIES = [
  { id: 'nav_love', icon: 'heart-outline', labelKey: 'nav_love' },
  { id: 'nav_setting', icon: 'cog-outline', labelKey: 'nav_setting' },
] as const

const GridItem = ({ icon, label, onPress }: { icon: string, label: string, onPress: () => void }) => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.gridItem} activeOpacity={0.7} onPress={onPress}>
      <PhIcon Icon={ICON_MAP[icon] ?? Heart} size={28} color={theme['c-font']} />
      <Text size={13} style={styles.gridLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const showExitBtn = useSettingValue('common.showExitBtn')

  const handleExit = () => {
    void confirmDialog({
      message: global.i18n.t('exit_app_tip'),
      confirmButtonText: global.i18n.t('list_remove_tip_button'),
    }).then(isExit => {
      if (!isExit) return
      exitApp('Exit Btn')
    })
  }

  return (
    <ScrollView style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <View style={styles.grid}>
        {
          NAV_ENTRIES.map(entry => (
            <GridItem
              key={entry.id}
              icon={entry.icon}
              label={t(entry.labelKey)}
              onPress={() => { setNavActiveId(entry.id) }}
            />
          ))
        }
        {
          showExitBtn
            ? <GridItem icon="logout" label={t('nav_exit')} onPress={handleExit} />
            : null
        }
      </View>
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    marginTop: 8,
  },
})
