package org.ward.app

import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.security.MessageDigest

/**
 * Ward's own installed APK, for "Give Ward to a friend": what it is (version, size, fingerprints)
 * and an exact copy of it in the cache, ready for the share sheet. Used by GiveWardPlugin and by
 * the debug-only check the emulator runs in CI. Nothing here touches the network.
 */
object GiveApk {
  const val MIME = "application/vnd.android.package-archive"
  /** The FileProvider that hands the copy out (AndroidManifest.xml, res/xml/give_paths.xml). */
  fun authority(context: Context) = context.packageName + ".give"

  data class Info(val version: String, val split: Boolean, val bytes: Long, val apkSha256: String, val certSha256: String)

  /** Only cache/give/ is shared, and only the latest copy lives there. */
  fun dir(context: Context) = File(context.cacheDir, "give")

  fun installed(context: Context) = File(context.applicationInfo.sourceDir)

  /** An app-store install arrives as several APKs; base.apk alone wouldn't install. */
  fun isSplit(context: Context) = !context.applicationInfo.splitSourceDirs.isNullOrEmpty()

  @Suppress("DEPRECATION")
  fun version(context: Context): String = context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "1"

  /** SHA-256 of the certificate the APK is signed with: the same on every genuine copy of Ward. */
  fun certSha256(context: Context): String {
    val pm = context.packageManager
    val certs: Array<Signature>? =
      if (Build.VERSION.SDK_INT >= 28) {
        pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo?.apkContentsSigners
      } else {
        @Suppress("DEPRECATION")
        pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES).signatures
      }
    val first = certs?.firstOrNull() ?: return ""
    return hex(MessageDigest.getInstance("SHA-256").digest(first.toByteArray()))
  }

  fun info(context: Context): Info {
    val apk = installed(context)
    return Info(version(context), isSplit(context), apk.length(), apk.inputStream().use { sha256(it) }, certSha256(context))
  }

  /** Copies the installed APK to cache/give/Ward-<version>.apk. Returns the copy and its SHA-256. */
  fun copy(context: Context): Pair<File, String> {
    val src = installed(context)
    val dir = dir(context)
    clear(context)
    dir.mkdirs()
    if (dir.usableSpace < src.length() + 20_000_000L) throw IOException("Not enough space to copy Ward")
    val name = "Ward-" + version(context).replace(Regex("[^A-Za-z0-9._-]"), "-") + ".apk"
    val out = File(dir, name)
    val part = File(dir, "$name.part")
    val md = MessageDigest.getInstance("SHA-256")
    src.inputStream().use { input ->
      part.outputStream().use { output ->
        val buf = ByteArray(1 shl 16)
        while (true) {
          val n = input.read(buf)
          if (n < 0) break
          md.update(buf, 0, n)
          output.write(buf, 0, n)
        }
      }
    }
    if (!part.renameTo(out)) throw IOException("Couldn't name the copy")
    return out to hex(md.digest())
  }

  fun clear(context: Context) {
    dir(context).listFiles()?.forEach { it.delete() }
  }

  fun sha256(input: InputStream): String {
    val md = MessageDigest.getInstance("SHA-256")
    val buf = ByteArray(1 shl 16)
    while (true) {
      val n = input.read(buf)
      if (n < 0) break
      md.update(buf, 0, n)
    }
    return hex(md.digest())
  }

  private fun hex(b: ByteArray) = b.joinToString("") { "%02x".format(it) }
}
