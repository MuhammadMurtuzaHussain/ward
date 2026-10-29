package org.ward.app

import android.view.WindowManager
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * For shared phones. `setSecure` keeps Ward's screen out of the recent-apps switcher (and out of
 * screenshots taken by other apps); `leave` is the quick exit: Ward locks itself in the web layer
 * first, then this sends it to the background so the home screen shows instead.
 */
@CapacitorPlugin(name = "Privacy")
class PrivacyPlugin : Plugin() {
  @PluginMethod
  fun setSecure(call: PluginCall) {
    val on = call.getBoolean("enabled", true) ?: true
    activity.runOnUiThread {
      if (on) activity.window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
      else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      call.resolve()
    }
  }

  @PluginMethod
  fun leave(call: PluginCall) {
    activity.runOnUiThread {
      activity.moveTaskToBack(true)
      call.resolve()
    }
  }
}
