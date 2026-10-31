package org.ward.app

import android.content.ClipData
import android.content.Intent
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.concurrent.Executors

/**
 * "Give Ward to a friend": sends Ward's own APK phone to phone through the system share sheet
 * (Bluetooth, Quick Share, or any app that takes a file), for children where the Play Store is
 * hard to use. No internet involved. `info` also gives the APK's and the signing certificate's
 * SHA-256, so the friend can check it's the real Ward against the fingerprint on GitHub releases.
 */
@CapacitorPlugin(name = "GiveWard")
class GiveWardPlugin : Plugin() {
  private val io = Executors.newSingleThreadExecutor()
  @Volatile private var cached: GiveApk.Info? = null

  // A copy from an earlier visit has done its job by now (the share sheet reads it straight away).
  override fun load() {
    io.execute { GiveApk.clear(context) }
  }

  private fun current(): GiveApk.Info = cached ?: GiveApk.info(context).also { cached = it }

  @PluginMethod
  fun info(call: PluginCall) {
    io.execute {
      try {
        val i = current()
        call.resolve(
          JSObject().apply {
            put("version", i.version)
            put("split", i.split)
            put("bytes", i.bytes)
            put("apkSha256", i.apkSha256)
            put("certSha256", i.certSha256)
          }
        )
      } catch (e: Exception) {
        call.reject("Couldn't read Ward's own file", e)
      }
    }
  }

  /** Copies the APK to cache/give/Ward-<version>.apk and opens the share sheet with it. */
  @PluginMethod
  fun share(call: PluginCall) {
    val title = call.getString("title") ?: "Ward"
    io.execute {
      try {
        if (GiveApk.isSplit(context)) return@execute call.reject("This install is split into several files", "SPLIT")
        val expected = current().apkSha256
        val (file, sha) = GiveApk.copy(context)
        if (sha != expected) {
          file.delete()
          return@execute call.reject("The copy didn't match the installed app", "MISMATCH")
        }
        val uri = FileProvider.getUriForFile(context, GiveApk.authority(context), file)
        val send =
          Intent(Intent.ACTION_SEND).apply {
            type = GiveApk.MIME
            putExtra(Intent.EXTRA_STREAM, uri)
            clipData = ClipData.newRawUri(file.name, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }
        val chooser = Intent.createChooser(send, title).apply { addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) }
        activity.runOnUiThread {
          try {
            activity.startActivity(chooser)
            call.resolve(JSObject().apply { put("name", file.name) })
          } catch (e: Exception) {
            call.reject("No app can send files here", "NO_TARGET", e)
          }
        }
      } catch (e: Exception) {
        call.reject("Couldn't get Ward ready to send", e)
      }
    }
  }
}
