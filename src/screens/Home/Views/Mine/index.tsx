import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { confirmDialog, createStyle } from '@/utils/tools'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { MciIcon } from '@/components/common/MciIcon'

// 宫格里的导航入口（as const 保证 labelKey 是字面量类型，能被 t() 接受）
const NAV_ENTRIES = [
  { id: 'nav_love', icon: 'heart-outline', labelKey: 'nav_love' },
  { id: 'nav_setting', icon: 'cog-outline', labelKey: 'nav_setting' },
] as const

const GridItem = ({ icon, label, onPress }: { icon: string, label: string, onPress: () => void }) => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.gridItem} activeOpacity={0.7} onPress={onPress}>
      <MciIcon name={icon} size={28} color={theme['c-font']} />
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
      {/* 页面大标题，替代原来的统一标题栏 */}
      <Text size={24} style={styles.title}>{t('nav_mine')}</Text>
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
  title: {
    fontWeight: 'bold',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingRight: 20,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    marginTop: 8,
  },
})
