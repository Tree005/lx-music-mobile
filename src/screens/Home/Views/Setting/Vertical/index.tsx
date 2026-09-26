import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react'
import { FlatList, View, type FlatListProps } from 'react-native'

import Header from './Header'
import Home from './Home'
import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import Source from '../settings/Basic/Source'
import SourceName from '../settings/Basic/SourceName'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import { TAB_OF_ID } from '@/config/constant'

// 竖屏设置页：两级结构
// - 主页：入口列表（数据同步 / 应用设置 / 自定义音源 / 检测更新 / 清除缓存）
// - 二级页：单页纵向堆叠该入口的分区，没有分区导航（返回栏见 Header.tsx）
const PAGE_SECTIONS = {
  // 应用设置：除有独立入口的「数据同步 / 检测更新」外的所有分区
  app: ['basic', 'player', 'lyric_desktop', 'search', 'list', 'backup', 'other'],
  sync: ['sync'],
  source: ['source', 'source_name'],
  version: ['version'],
  cache: ['other'],
} as const

// 二级页标题用的 i18n key
const PAGE_TITLES = {
  app: 'setting_app',
  sync: 'setting_sync',
  source: 'setting_basic_source',
  version: 'setting_version',
  cache: 'setting_cache',
} as const satisfies Record<SettingPageIds, string>

type SectionId = typeof PAGE_SECTIONS[keyof typeof PAGE_SECTIONS][number]
export type SettingPageIds = keyof typeof PAGE_SECTIONS

type FlatListType = FlatListProps<SectionId>

const SectionItem = memo(({ id }: { id: SectionId }) => {
  switch (id) {
    case 'basic': return <Basic />
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'source': return <Source />
    case 'source_name': return <SourceName />
  }
}, () => true)


export interface SettingVerticalType {
  /** 二级页回到设置主页；已在主页时返回 false，交给外层处理 */
  back: () => boolean
}

export default forwardRef<SettingVerticalType, {}>((props, ref) => {
  const t = useI18n()
  const [page, setPage] = useState<'home' | SettingPageIds>('home')

  const openPage = useCallback((id: SettingPageIds) => {
    setPage(id)
  }, [])

  // 主页的返回箭头回到底部 Tab，二级页的返回箭头回到设置主页
  const handleBack = useCallback(() => {
    if (page == 'home') setNavActiveId(TAB_OF_ID.nav_setting)
    else setPage('home')
  }, [page])

  // 物理返回键由外层的 Views/Setting/index.tsx 统一接管（它的监听后注册、先执行），
  // 所以这里只暴露「退一层」，让外层先问一句
  useImperativeHandle(ref, () => ({
    back() {
      if (page == 'home') return false
      setPage('home')
      return true
    },
  }))

  const renderItem: FlatListType['renderItem'] = ({ item }) => <SectionItem id={item} />
  const getkey: FlatListType['keyExtractor'] = item => item

  return (
    <View style={styles.container}>
      <Header title={t(page == 'home' ? 'nav_setting' : PAGE_TITLES[page])} onBack={handleBack} />
      {
        page == 'home'
          ? <Home onOpenPage={openPage} />
          : (
              <FlatList
                // 换页时重建，避免带着上一页的滚动位置
                key={page}
                data={PAGE_SECTIONS[page] as readonly SectionId[]}
                keyboardShouldPersistTaps={'always'}
                renderItem={renderItem}
                keyExtractor={getkey}
                contentContainerStyle={styles.content}
                maxToRenderPerBatch={2}
                windowSize={2}
                initialNumToRender={1}
              />
            )
      }
    </View>
  )
})


const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 15,
  },
})
