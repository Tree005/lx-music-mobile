import { useRef, forwardRef, useImperativeHandle } from 'react'
import { View, TouchableOpacity } from 'react-native'

// import music from '@/utils/musicSdk'
import { BorderWidths } from '@/theme'
// import InsetShadow from 'react-native-inset-shadow'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useHorizontalMode } from '@/utils/hooks'
import { setNavActiveId } from '@/core/common'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'

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
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)
  const theme = useTheme()
  const t = useI18n()
  // 横屏页面结构由 Horizontal 那套单独实现（切换器在它的标题栏上），这里保持上游原样
  const isHorizontal = useHorizontalMode()

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

  // 「取消」回到搜索页所属的底部 Tab（首页），替代原来的返回栏
  const handleCancel = () => {
    setNavActiveId('nav_home')
  }

  return (
    <View style={{ ...styles.container, backgroundColor: isHorizontal ? undefined : theme['c-content-background'] }}>
      {/* 第一行：源选择器 + 搜索框（竖屏再加「取消」） */}
      <View style={{ ...styles.searchBar, borderBottomColor: theme['c-border-background'] }}>
        <View style={styles.selector}>
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center />
        </View>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
        {isHorizontal
          ? null
          : <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text color={theme['c-primary-font']}>{t('cancel')}</Text>
            </TouchableOpacity>
        }
      </View>
      {/* 第二行：单曲 / 歌单 切换（仅竖屏） */}
      {isHorizontal
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
    paddingRight: 10,
    borderBottomWidth: BorderWidths.normal,
  },
  selector: {
    // width: 86,
  },
  cancelBtn: {
    height: '100%',
    paddingLeft: 10,
    justifyContent: 'center',
  },
  typeBar: {
    height: TYPE_BAR_HEIGHT,
    justifyContent: 'center',
  },
})
