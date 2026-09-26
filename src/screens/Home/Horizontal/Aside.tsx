import { memo, type ComponentType } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { ChartBar, Gear, Heart, House, MagnifyingGlass, MusicNotes, SignOut, VinylRecord, type IconProps } from 'phosphor-react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { PhIcon } from '@/components/common/PhIcon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
// import commonState from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import { useSettingValue } from '@/store/setting/hook'

const NAV_WIDTH = 68

// NAV_MENUS 里的 icon 仍是 IcoMoon 名，这里映射到 Phosphor 组件
// （NAV_MENUS 还被别处引用，不改它）
const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  'search-2': MagnifyingGlass,
  album: VinylRecord,
  leaderboard: ChartBar,
  love: Heart,
  setting: Gear,
  // 下面两个是 Aside 内硬编码的菜单图标名
  home: House,
  exit2: SignOut,
}

const styles = createStyle({
  container: {
    flexGrow: 0,
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    // padding: 10,
    borderRightWidth: BorderWidths.normal,
    paddingBottom: 10,
    width: NAV_WIDTH,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    marginLeft: 16,
  },
  menus: {
    flex: 1,
  },
  list: {
    // paddingTop: 10,
    paddingBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    paddingTop: 15,
    paddingBottom: 15,
    // paddingLeft: 25,
    // paddingRight: 25,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  iconContent: {
    // width: 24,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
  },
  text: {
    paddingLeft: 15,
    // fontWeight: '500',
  },
})

const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <PhIcon Icon={MusicNotes} weight="fill" size={22} color={theme['c-primary-dark-100-alpha-300']} />
        {/* <Text style={styles.headerText} size={16} color={theme['c-primary-dark-100-alpha-300']}>LX Music</Text> */}
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  // const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()

  return activeId == id
    ? <View style={styles.menuItem}>
        <View style={styles.iconContent}>
          <PhIcon Icon={ICON_MAP[icon] ?? MagnifyingGlass} size={20} color={theme['c-primary-font-active']} />
        </View>
        {/* <Text style={styles.text} size={14} color={theme['c-primary-font']}>{t(id)}</Text> */}
      </View>
    : <TouchableOpacity style={styles.menuItem} onPress={() => { onPress(id) }}>
        <View style={styles.iconContent}>
          <PhIcon Icon={ICON_MAP[icon] ?? MagnifyingGlass} size={20} color={theme['c-font-label']} />
        </View>
        {/* <Text style={styles.text} size={14}>{t(id)}</Text> */}
      </TouchableOpacity>
}

export default memo(() => {
  const theme = useTheme()
  // console.log('render drawer nav')
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then(isExit => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }

    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, borderRightColor: theme['c-border-background'] }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      {
        showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null
      }
      {
        showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null
      }
    </View>
  )
})

