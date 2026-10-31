package org.ward.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.FileProvider

/**
 * Debug builds only. `adb shell am broadcast -n org.ward.app/.GiveCheckReceiver` makes the same
 * copy "Give Ward to a friend" shares, reads it back through the FileProvider the share sheet
 * uses, and logs every fingerprint on one line (tag WardGive) for mobile/ci/give-check.sh to
 * compare with the installed APK.
 */
class GiveCheckReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val pending = goAsync()
    Thread {
      try {
        val info = GiveApk.info(context)
        val (file, copySha) = GiveApk.copy(context)
        val uri = FileProvider.getUriForFile(context, GiveApk.authority(context), file)
        val viaProvider = context.contentResolver.openInputStream(uri)?.use { GiveApk.sha256(it) } ?: "none"
        val type = context.contentResolver.getType(uri) ?: "none"
        Log.i(
          "WardGive",
          "GIVE_CHECK ok version=${info.version} split=${info.split} bytes=${info.bytes} file=${file.name} " +
            "apk=${info.apkSha256} copy=$copySha provider=$viaProvider type=$type cert=${info.certSha256} uri=$uri",
        )
      } catch (e: Exception) {
        Log.e("WardGive", "GIVE_CHECK failed", e)
      } finally {
        pending.finish()
      }
    }.start()
  }
}
