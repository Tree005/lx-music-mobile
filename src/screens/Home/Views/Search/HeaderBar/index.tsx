import { useRef, forwardRef, useImperativeHandle } from 'react'
import { View, TouchableOpacity } from 'react-native'

// import music from '@/utils/musicSdk'
import { BorderWidths } from '@/theme'
// import InsetShadow from 'react-native-inset-shadow'
import { CaretLeft } from 'phosphor-react-native'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { setNavActiveId } from '@/core/common'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'
import { PRESS_OPACITY } from '@/theme/motion'

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

// 「单曲/歌单」切换行的高度（与原标题栏同高）
const TYPE_BAR_HEIGHT = scaleSizeH(HEADER_HEIGHT)

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
  /** 「单曲/歌单」切换行是否显示（只在该搜索页结果列表状态下显示，空态隐藏） */
  showTypeBar: boolean
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList, showTypeBar }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)
  const theme = useTheme()
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      sourceSelectorRef.current?.setSourceList(list, source)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])

  // 返回箭头：回到搜索页所属的底部 Tab（首页）
  const handleCancel = () => {
    setNavActiveId('nav_home')
  }
  // 「搜索」按钮：提交输入框当前内容
  const handleSearchPress = () => {
    onSearch(searchInputRef.current?.getText() ?? '')
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      {/* 第一行：返回 + 源选择（圆形）+ 搜索框 + 搜索按钮 */}
      <View style={{ ...styles.searchBar, borderBottomColor: theme['c-border-background'] }}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={PRESS_OPACITY} onPress={handleCancel}>
          <PhIcon Icon={CaretLeft} size={22} color={theme['c-font']} />
        </TouchableOpacity>
        <View style={styles.selector}>
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} circle={true} />
        </View>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
        <TouchableOpacity style={styles.searchBtn} activeOpacity={PRESS_OPACITY} onPress={handleSearchPress}>
          <Text color={theme['c-primary-font']} size={15}>{t('search_action')}</Text>
        </TouchableOpacity>
      </View>
      {/* 第二行：单曲 / 歌单 切换（只在结果列表显示时出现） */}
      {!showTypeBar
        ? null
        : <View style={styles.typeBar}>
            <SearchTypeSelector />
          </View>
      }
    </View>
  )
})

const styles = createStyle({
  container: {
    // 与下方列表同级，需抬高层级让源选择下拉菜单盖住列表
    zIndex: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingLeft: 4,
    paddingRight: 10,
    borderBottomWidth: BorderWidths.normal,
  },
  backBtn: {
    height: '100%',
    paddingLeft: 6,
    paddingRight: 6,
    justifyContent: 'center',
  },
  selector: {
    // width: 86,
    marginRight: 6,
  },
  searchBtn: {
    height: '100%',
    paddingLeft: 12,
    paddingRight: 2,
    justifyContent: 'center',
  },
  typeBar: {
    height: TYPE_BAR_HEIGHT,
    justifyContent: 'center',
  },
})
