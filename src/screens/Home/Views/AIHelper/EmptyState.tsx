import { memo, useCallback } from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { Heart } from 'phosphor-react-native'
import { PhIcon } from '@/components/common/PhIcon'
import Text from '@/components/common/Text'
import Background from '@/screens/PlayDetail/components/Background'
import { startSession } from '@/core/aiRadio'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { PRESS_OPACITY } from '@/theme/motion'

// 心动页 · 空态：
// - 正在构建推歌池（进页面自动开始）→ 转圈；
// - 池子为空（没有收藏 / 歌单）→ 提示先去收藏或添加歌曲；
// - 其余（有音乐在响没被抢播等）→ 开始按钮，点了开新会话接管播放
export default memo(({ starting, poolEmpty }: {
  starting: boolean
  poolEmpty: boolean
}) => {
  const t = useI18n()
  const theme = useTheme()

  const handleStart = useCallback(() => {
    if (starting) return
    void startSession()
  }, [starting])

  return (
    <View style={styles.page}>
      <Background />
      <View style={styles.content}>
        {
          starting
            ? <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.6)" />
            : (
                <>
                  <PhIcon Icon={Heart} size={48} color="rgba(255, 255, 255, 0.35)" />
                  {
                    poolEmpty
                      ? <Text style={styles.tip} size={14} color="rgba(255, 255, 255, 0.65)">{t('ai_radio_empty')}</Text>
                      : (
                          <TouchableOpacity
                            style={[styles.btn, { backgroundColor: theme['c-primary'] }]}
                            activeOpacity={PRESS_OPACITY}
                            onPress={handleStart}
                          >
                            <Text size={15} color="#fff">{t('ai_radio_start')}</Text>
                          </TouchableOpacity>
                        )
                  }
                </>
              )
        }
      </View>
    </View>
  )
})

const styles = createStyle({
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: {
    marginTop: 15,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  btn: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
})
