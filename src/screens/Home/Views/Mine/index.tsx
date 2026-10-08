import { useEffect, type ComponentType } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ClockCounterClockwise, CloudArrowDown, Gear, type IconProps } from 'phosphor-react-native'

import Mylist from '../Mylist'
import { PhIcon } from '@/components/common/PhIcon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { BorderWidths } from '@/theme'
import { setNavActiveId } from '@/core/common'
import { setActiveList } from '@/core/list'
import { useNavActiveId } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { LIST_IDS } from '@/config/constant'
import { SLIDE_DURATION_STACK } from '@/components/transitions/constants'
import { PRESS_OPACITY } from '@/theme/motion'

// 顶部宫格入口（as const 保证 labelKey 是字面量类型，能被 t() 接受）
const GRID_ENTRIES = [
  { id: 'nav_download', icon: CloudArrowDown, labelKey: 'nav_download' },
  { id: 'nav_history', icon: ClockCounterClockwise, labelKey: 'nav_history' },
  { id: 'nav_setting', icon: Gear, labelKey: 'nav_setting' },
] as const

const GridItem = ({ icon, label, onPress }: {
  icon: ComponentType<IconProps>
  label: string
  onPress: () => void
}) => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.gridItem} activeOpacity={PRESS_OPACITY} onPress={onPress}>
      <PhIcon Icon={icon} size={28} color={theme['c-primary']} />
      <Text style={styles.gridLabel} size={14}>{label}</Text>
    </TouchableOpacity>
  )
}

// 我的页：大标题 + 宫格入口 + 我的收藏（单曲 / 歌单双 tab）
export default () => {
  const theme = useTheme()
  const t = useI18n()
  const navActiveId = useNavActiveId()

  // 收藏区的「单曲」tab 展示的是我的收藏，所以进入我的页时把当前列表切到收藏。
  // 延迟到转场结束后再钉：歌单详情页的歌曲列表会实时跟随当前列表（它监听 mylistToggled），
  // 返回时详情页还在滑出，立即钉会把正在滑出的详情页内容换成收藏列表
  useEffect(() => {
    if (navActiveId != 'nav_mine') return
    const timer = setTimeout(() => {
      // 竞态兜底：回调到期时可能已离开「我的」页（clearTimeout 对已入队的回调无效）
      if (commonState.navActiveId != 'nav_mine') return
      setActiveList(LIST_IDS.LOVE)
    }, SLIDE_DURATION_STACK + 60)
    return () => { clearTimeout(timer) }
  }, [navActiveId])

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <Text style={{ ...styles.title, borderBottomColor: theme['c-border-background'] }} size={24}>{t('mine_title')}</Text>
      <View style={styles.grid}>
        {
          GRID_ENTRIES.map(entry => (
            <GridItem
              key={entry.id}
              icon={entry.icon}
              label={t(entry.labelKey)}
              onPress={() => { setNavActiveId(entry.id) }}
            />
          ))
        }
      </View>
      <View style={{ ...styles.divider, backgroundColor: theme['c-150'] }} />
      {/* 「我的收藏」标题与新建/导入入口由 Mylist 自己渲染；
          active：只在「我的」页真正显示时启用内嵌列表的钉住逻辑（详情页转场期间不抢回列表） */}
      <Mylist embedded active={navActiveId == 'nav_mine'} />
    </View>
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
    paddingBottom: 12,
    borderBottomWidth: BorderWidths.normal,
  },
  grid: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 16,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    marginTop: 8,
  },
  // 宫格与收藏之间的分隔灰条
  divider: {
    height: scaleSizeH(10),
  },
})
