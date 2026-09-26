import { useRef } from 'react'
import { View } from 'react-native'
import { ArrowsDownUp, Plus } from 'phosphor-react-native'

import ListMenu, { type ListMenuType } from './ListMenu'
import List from './List'
import ListImportExport, { type ListImportExportType } from './ListImportExport'
import { handleRemove, handleSync } from './listAction'
import ListMusicSort, { type ListMusicSortType } from './ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from './DuplicateMusic'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import listState from '@/store/list/state'


// 歌单列表：作为「我的收藏」的第二个 tab 直接渲染
// （原来是抽屉式懒加载，靠 changeLoveListVisible 事件才会挂载，现在是 tab 所以直接显示）
// 新建 / 重命名 / 导入歌单都在父层（Mylist）里，这里只负责列表和菜单
export default ({ onCreate, onRename, onImport }: {
  /** 新建歌单，参数是插入位置 */
  onCreate: (position: number) => void
  /** 重命名歌单 */
  onRename: (listInfo: LX.List.UserListInfo) => void
  /** 打开导入歌单弹层 */
  onImport: () => void
}) => {
  const t = useI18n()
  const theme = useTheme()
  const listMenuRef = useRef<ListMenuType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)

  return (
    <View style={styles.container}>
      <List onShowMenu={(info, position) => listMenuRef.current?.show(info, position)} />
      {/* 列表下方的两个大按钮：新建歌单 / 导入外部歌单 */}
      <View style={styles.btns}>
        <Button
          style={{ ...styles.btn, ...styles.btnLeft, backgroundColor: theme['c-primary'] }}
          onPress={() => { onCreate(listState.userList.length) }}
        >
          <PhIcon Icon={Plus} size={16} color={theme['c-content-background']} style={styles.btnIcon} />
          <Text size={15} color={theme['c-content-background']}>{t('songlist_create')}</Text>
        </Button>
        <Button
          style={{ ...styles.btn, borderColor: theme['c-border-background'] }}
          onPress={onImport}
        >
          <PhIcon Icon={ArrowsDownUp} size={16} color={theme['c-font']} style={styles.btnIcon} />
          <Text size={15} color={theme['c-font']}>{t('songlist_import_btn')}</Text>
        </Button>
      </View>
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />
      <ListMenu
        ref={listMenuRef}
        onNew={index => { onCreate(index) }}
        onRename={info => { onRename(info) }}
        onSort={info => listMusicSortRef.current?.show(info)}
        onDuplicateMusic={info => duplicateMusicRef.current?.show(info)}
        onImport={(info, position) => listImportExportRef.current?.import(info, position)}
        onExport={(info, position) => listImportExportRef.current?.export(info, position)}
        onRemove={info => { handleRemove(info) }}
        onSync={info => { handleSync(info) }}
        onSelectLocalFile={(info, position) => listImportExportRef.current?.selectFile(info, position)}
      />
      {/* <ImportExport actionType={actionType} visible={isShowChoosePath} hide={() => setShowChoosePath(false)} selectedListRef={selectedListRef} /> */}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  btns: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    height: scaleSizeH(52),
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLeft: {
    marginRight: 16,
  },
  btnIcon: {
    marginRight: 6,
  },
})
