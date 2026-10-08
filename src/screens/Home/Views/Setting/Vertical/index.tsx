import { forwardRef, memo, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { Animated, FlatList, View, type FlatListProps } from 'react-native'

import Header from './Header'
import Home from './Home'
import Startup from '../settings/Startup'
import Player from '../settings/Player'
import Display from '../settings/Display'
import Appearance from '../settings/Appearance'
import LyricDesktop from '../settings/LyricDesktop'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import Source from '../settings/Basic/Source'
import SourceName from '../settings/Basic/SourceName'
import useSlideTransition from '@/components/transitions/useSlideTransition'
import { SLIDE_DURATION_SETTING, SLIDE_PARALLAX_RATIO, SLIDE_SCRIM_OPACITY } from '@/components/transitions/constants'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import { TAB_OF_ID } from '@/config/constant'

// 竖屏设置页：两级结构
// - 主页：入口列表（播放 / 显示与歌词 / 列表 / 数据同步 / 备份与恢复 / 自定义音源 / 缓存与更新）
// - 二级页：单页纵向堆叠该入口的分区，没有分区导航（返回栏见 Header.tsx）
// 两级之间走横滑转场（与 NavStack 同一套模式）：home → 二级 = forward（新页从右侧滑入、
// 主页左移视差），二级 → home = backward（二级页右滑出、主页从视差位滑回）；
// 每页各渲染一份 Header，标题随页滑动
const PAGE_SECTIONS = {
  // 一级入口 → 二级页包含的分区
  play: ['startup', 'player'],
  display: ['display', 'appearance', 'lyric_desktop'],
  list: ['list'],
  sync: ['sync'],
  backup: ['backup'],
  source: ['source', 'source_name'],
  update: ['other', 'version'],
} as const

// 二级页标题用的 i18n key
const PAGE_TITLES = {
  play: 'setting_player',
  display: 'setting_display_lyric',
  list: 'setting_list',
  sync: 'setting_sync',
  backup: 'setting_backup',
  source: 'setting_basic_source',
  update: 'setting_cache_update',
} as const satisfies Record<SettingPageIds, string>

type SectionId = typeof PAGE_SECTIONS[keyof typeof PAGE_SECTIONS][number]
export type SettingPageIds = keyof typeof PAGE_SECTIONS
type PageId = 'home' | SettingPageIds
type SlideDir = 'forward' | 'backward'
type SlideRole = 'from' | 'to' | 'settled'

type FlatListType = FlatListProps<SectionId>

const SectionItem = memo(({ id }: { id: SectionId }) => {
  switch (id) {
    case 'startup': return <Startup />
    case 'player': return <Player />
    case 'display': return <Display />
    case 'appearance': return <Appearance />
    case 'lyric_desktop': return <LyricDesktop />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'source': return <Source />
    case 'source_name': return <SourceName />
    case 'other': return <Other />
    case 'version': return <Version />
  }
}, () => true)

// FlatList 的渲染函数与组件状态无关，放模块级保持引用稳定
const renderItem: FlatListType['renderItem'] = ({ item }) => <SectionItem id={item} />
const getkey: FlatListType['keyExtractor'] = item => item

interface PageViewProps {
  id: PageId
  role: SlideRole
  dir: SlideDir
  /** 0 → 1 的转场进度（settled 角色不读，此时已被复位为 0） */
  progress: Animated.Value
  /** 屏幕宽度（视差与滑入位移的基准） */
  width: number
  /** 主页入口 → 打开对应二级页 */
  onOpenPage: (id: SettingPageIds) => void
  /** 二级页返回 → 回设置主页 */
  onGoHome: () => void
  /** 设置主页返回 → 回底部 Tab */
  onBackToTab: () => void
}

// 单层页面：absoluteFill + 页面背景色（两层叠放时不能互相透视）+ 自己的返回栏与内容
const PageView = ({ id, role, dir, progress, width, onOpenPage, onGoHome, onBackToTab }: PageViewProps) => {
  const theme = useTheme()
  const t = useI18n()
  const parallax = -width * SLIDE_PARALLAX_RATIO

  // settled：恒在原位
  let translateX: number | Animated.AnimatedInterpolation<number> = 0
  let scrimOpacity: number | Animated.AnimatedInterpolation<number> = 0
  if (role === 'from') {
    // 旧页：前进时滑到视差位（露在下面），后退时向右滑出屏幕
    translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: dir === 'forward' ? [0, parallax] : [0, width],
    })
    scrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, SLIDE_SCRIM_OPACITY] })
  } else if (role === 'to') {
    // 新页：前进时从屏幕右侧滑入，后退时从视差位滑回
    translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: dir === 'forward' ? [width, 0] : [parallax, 0],
    })
    scrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [SLIDE_SCRIM_OPACITY, 0] })
  }

  return (
    <Animated.View
      style={[styles.fill, { backgroundColor: theme['c-100'] }, { transform: [{ translateX }] }]}
      pointerEvents={role === 'settled' ? 'auto' : 'none'}
    >
      <Header
        title={id == 'home' ? t('nav_setting') : t(PAGE_TITLES[id])}
        onBack={id == 'home' ? onBackToTab : onGoHome}
      />
      {id == 'home'
        ? <Home onOpenPage={onOpenPage} />
        : (
            <FlatList
              // 换页时重建，避免带着上一页的滚动位置
              key={id}
              data={PAGE_SECTIONS[id] as readonly SectionId[]}
              keyboardShouldPersistTaps={'always'}
              showsVerticalScrollIndicator={false}
              renderItem={renderItem}
              keyExtractor={getkey}
              contentContainerStyle={styles.content}
              maxToRenderPerBatch={2}
              windowSize={2}
              initialNumToRender={1}
            />
          )}
      {/* 变暗蒙层：转场中渲染 Animated 蒙层，结算后整个不渲染 ——
          不能在同一个 View 实例上把 opacity 从动画值切回静态数字
          （实测静态值不生效、会残留为不透明把整页盖黑） */}
      {role === 'settled'
        ? null
        : <Animated.View pointerEvents="none" style={[styles.scrim, { opacity: scrimOpacity }]} />}
    </Animated.View>
  )
}

export interface SettingVerticalType {
  /** 二级页回到设置主页；已在主页时返回 false，交给外层处理 */
  back: () => boolean
}

export default forwardRef<SettingVerticalType, {}>((props, ref) => {
  const { width } = useWindowSize()
  const [page, setPage] = useState<PageId>('home')
  // 转场起点页；null = 已结算（不在转场中）
  const [prevPage, setPrevPage] = useState<PageId | null>(null)
  const { progress, start, settle } = useSlideTransition(SLIDE_DURATION_SETTING)

  // ref 同步读最新值（落定回调里可能马上又要开新转场，state 闭包会过期）
  const pageRef = useRef<PageId>('home')
  const prevPageRef = useRef<PageId | null>(null)

  // 转场落定：先收回 from 层、再复位 progress —— 顺序颠倒会让 from 层在「仍可见」的一帧里闪回原位
  const finish = useCallback(() => {
    if (prevPageRef.current === null) return
    prevPageRef.current = null
    setPrevPage(null)
    progress.setValue(0)
  }, [progress])

  // 切页：有在途转场先立即结算（以结算出的页作为下一段的 from），再把当前页作为 from 开启新转场
  const goto = useCallback((id: PageId) => {
    if (id === pageRef.current) return
    const from = pageRef.current
    if (prevPageRef.current !== null) settle(finish)
    prevPageRef.current = from
    pageRef.current = id
    setPrevPage(from)
    setPage(id)
  }, [settle, finish])

  const openPage = useCallback((id: SettingPageIds) => { goto(id) }, [goto])
  const goHome = useCallback(() => { goto('home') }, [goto])
  // 设置主页的返回箭头回到底部 Tab
  const backToTab = useCallback(() => { setNavActiveId(TAB_OF_ID.nav_setting) }, [])

  // 物理返回键由外层的 Views/Setting/index.tsx 统一接管（它的监听后注册、先执行），
  // 所以这里只暴露「退一层」，让外层先问一句
  useImperativeHandle(ref, () => ({
    back() {
      if (pageRef.current == 'home') return false
      goHome()
      return true
    },
  }))

  // 转场状态提交后、绘制前启动动画：保证出现的第一帧就已经是「起始位移」，
  // 而不是先闪一帧旧位置再跳过去
  useLayoutEffect(() => {
    if (prevPage === null) return
    start(finish)
  }, [prevPage, start, finish])

  // 方向：home → 二级 = forward；二级 → home = backward
  const dir: SlideDir = prevPage === 'home' ? 'forward' : 'backward'

  // 转场中：prevPage 作 from 层、page 作 to 层；已结算只剩当前页（settled）
  const layers: Array<{ id: PageId, role: SlideRole }> = []
  if (prevPage !== null) layers.push({ id: prevPage, role: 'from' })
  layers.push({ id: page, role: prevPage === null ? 'settled' : 'to' })

  return (
    <View style={styles.container}>
      {layers.map(layer => (
        <PageView
          key={layer.id}
          id={layer.id}
          role={layer.role}
          dir={dir}
          progress={progress}
          width={width}
          onOpenPage={openPage}
          onGoHome={goHome}
          onBackToTab={backToTab}
        />
      ))}
    </View>
  )
})


const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  content: {
    paddingTop: 8,
    paddingBottom: 15,
  },
})
