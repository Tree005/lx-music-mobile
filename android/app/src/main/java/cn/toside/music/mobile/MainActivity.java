package cn.toside.music.mobile;

import android.graphics.Color;
import android.os.Build;
import androidx.core.view.WindowCompat;
import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends NavigationActivity {

  // 让内容延伸到系统栏后面（全应用沉浸式）。
  // RNN 应用页面 options 时会 setDecorFitsSystemWindows(true) 把窗口设回非沉浸，JS 侧已在
  // 页面出现/RNN 命令完成时补刀；但息屏、锁屏期间窗口状态还可能被系统重置，而解锁回到前台时
  // JS 未必收到 AppState 回调（AOD 下进程可能一直处于 resumed），所以这里在原生窗口重新获得
  // 焦点 / 回到前台时再补一次，保证底部栏始终贴底。
  private void applyEdgeToEdge() {
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      // 关闭系统给导航栏加的对比度遮罩，否则透明导航栏上会多一层灰底
      getWindow().setNavigationBarContrastEnforced(false);
    }
    getWindow().setNavigationBarColor(Color.TRANSPARENT);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) applyEdgeToEdge();
  }

  @Override
  public void onResume() {
    super.onResume();
    applyEdgeToEdge();
  }
}
