import { View } from 'react-native'
import { ArrowsDownUp, Plus } from 'phosphor-react-native'

import List from './List'
import { handleRemove } from './listAction'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { PhIcon } from '@/components/common/PhIcon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import listState from '@/store/list/state'


// 歌单列表：收藏 / 导入的歌单与自建歌单都在这里
// （原来是抽屉式懒加载，且会把内置的「试听列表 / 我的收藏」也列出来，现在两者都去掉了）
export default ({ onOpenList, onCreate, onImport }: {
  /** 点歌单：切到该歌单 */
  onOpenList: (item: LX.List.UserListInfo) => void
  /** 新建歌单 */
  onCreate: (position: number) => void
  /** 打开导入歌单弹层 */
  onImport: () => void
}) => {
  const t = useI18n()
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <List onOpenList={onOpenList} onRemove={handleRemove} />
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
