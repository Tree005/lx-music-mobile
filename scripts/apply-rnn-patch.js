/**
 * RNN 本地补丁自动应用脚本（挂在 package.json 的 postinstall 上）
 *
 * 背景：「退出播放页时底部栏先顶起再落下」抖动的根因修复需要改 RNN 的原生源码
 * （SystemUiUtils.kt 里 showNavigationBar / showStatusBar 两处
 * setDecorFitsSystemWindows(window, true) → false，详见 CODEBUDDY.md「已知问题与约定」）。
 *
 * 但 node_modules 不在版本控制里——npm i / npm ci 会把补丁静默冲掉，
 * 届时抖动会复发且不报任何错。这个脚本在每次依赖安装后自动把 patches/ 里的
 * 完整文件副本覆盖回 node_modules，并校验结果；也可以手动执行：
 *
 *   node scripts/apply-rnn-patch.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PATCH_SRC = path.join(ROOT, 'patches/react-native-navigation+7.39.2__SystemUiUtils.kt')
const TARGET = path.join(
  ROOT,
  'node_modules/react-native-navigation/lib/android/app/src/main/java/com/reactnativenavigation/utils/SystemUiUtils.kt',
)
// 补丁是按 RNN 某个版本的源码逐字改的，升级后源码可能已变（行号/上下文/方法签名都可能不同）。
// 版本不符时绝不覆盖：静默覆盖只会得到一个「看起来通过校验、实际行为未知」的文件
const EXPECTED_VERSION = '7.39.2'

const fail = msg => {
  console.error('[apply-rnn-patch] 失败：' + msg)
  process.exit(1)
}

const versionFile = path.join(ROOT, 'node_modules/react-native-navigation/package.json')
if (!fs.existsSync(versionFile)) fail('读不到 react-native-navigation 版本（依赖未安装？）：' + versionFile)
const version = JSON.parse(fs.readFileSync(versionFile, 'utf8')).version
if (version !== EXPECTED_VERSION) {
  fail(`RNN 版本不符：补丁对应 ${EXPECTED_VERSION}，当前 ${version}。请在 patches/ 下按新版本重新生成副本后再执行`)
}

if (!fs.existsSync(PATCH_SRC)) fail('补丁源文件不存在：' + PATCH_SRC)
if (!fs.existsSync(TARGET)) fail('目标文件不存在（依赖未安装？）：' + TARGET)

const patched = fs.readFileSync(PATCH_SRC, 'utf8')
const current = fs.readFileSync(TARGET, 'utf8')

// 幂等：内容已一致就不写（避免无谓的 mtime 变化触发 gradle 重编）
if (current === patched) {
  console.log('[apply-rnn-patch] 补丁已是最新，无需应用')
  process.exit(0)
}

fs.writeFileSync(TARGET, patched)

// 校验：两处 show 的窗口重置必须已改为 false（正则带 WindowCompat. 前缀，
// 注释文字里的「原为 setDecorFitsSystemWindows(window, true)」不会被误匹配）
const applied = fs.readFileSync(TARGET, 'utf8')
const trueCount = (applied.match(/WindowCompat\.setDecorFitsSystemWindows\(window, true\)/g) || []).length
const falseCount = (applied.match(/WindowCompat\.setDecorFitsSystemWindows\(window, false\)/g) || []).length
if (trueCount !== 0 || falseCount !== 4) {
  fail(`校验未通过：期望 4 处 false、0 处 true，实际 false=${falseCount}、true=${trueCount}`)
}

console.log('[apply-rnn-patch] 补丁已应用并通过校验（4 处 setDecorFitsSystemWindows 全部为 false）')
