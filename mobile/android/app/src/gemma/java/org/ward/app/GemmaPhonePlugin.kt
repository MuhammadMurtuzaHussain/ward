package org.ward.app

import android.app.ActivityManager
import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.ResponseFormat
import com.google.ai.edge.litertlm.SamplerConfig
import java.io.File
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Gemma 4 E2B on the phone, through Google's LiteRT-LM runtime: the same Gemma family that reads
 * chats on a computer, sized for phones with about 6 GB of RAM. The 2 GB model is only downloaded
 * when the child (or a parent) chooses to, ideally on Wi-Fi, and lives in the app's private
 * storage. Chats are read here and never leave the phone.
 */
@CapacitorPlugin(name = "GemmaPhone")
class GemmaPhonePlugin : Plugin() {
  companion object {
    const val URL_MODEL =
      "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-gpu.litertlm"
    const val MODEL_BYTES = 2008432640L
    // Android reports a little less than the box says: a 6 GB phone shows about 5.5 GB.
    const val MIN_RAM = 5_300_000_000L
  }

  private val io = Executors.newSingleThreadExecutor()
  private val net = Executors.newSingleThreadExecutor()
  private var engine: Engine? = null
  private var backendName: String? = null
  @Volatile private var downloading = false
  @Volatile private var cancel = false

  private val dir get() = File(context.filesDir, "models").apply { mkdirs() }
  private val model get() = File(dir, "gemma-4-E2B-it-gpu.litertlm")
  private val part get() = File(dir, "gemma-4-E2B-it-gpu.litertlm.part")

  private fun ram(): Long {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    return ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }.totalMem
  }

  @PluginMethod
  fun status(call: PluginCall) {
    call.resolve(
      JSObject().apply {
        put("ramBytes", ram())
        put("supported", ram() >= MIN_RAM)
        put("modelBytes", MODEL_BYTES)
        put("downloaded", model.exists() && model.length() == MODEL_BYTES)
        put("partialBytes", if (part.exists()) part.length() else 0)
        put("freeBytes", dir.usableSpace)
        put("downloading", downloading)
        put("loaded", engine != null)
        put("backend", backendName)
      }
    )
  }

  /** Resumable: a dropped connection picks up where it stopped. Emits "progress" events. */
  @PluginMethod
  fun download(call: PluginCall) {
    if (downloading) return call.reject("Already downloading")
    if (model.exists() && model.length() == MODEL_BYTES) return call.resolve()
    val need = MODEL_BYTES - (if (part.exists()) part.length() else 0)
    if (dir.usableSpace < need + 200_000_000L) return call.reject("Not enough space: Gemma needs about 2 GB free")
    downloading = true
    cancel = false
    call.setKeepAlive(true)
    net.execute {
      try {
        var have = if (part.exists()) part.length() else 0L
        val conn = (URL(URL_MODEL).openConnection() as HttpURLConnection).apply {
          instanceFollowRedirects = true
          connectTimeout = 20_000
          readTimeout = 60_000
          if (have > 0) setRequestProperty("Range", "bytes=$have-")
        }
        if (have > 0 && conn.responseCode != 206) have = 0 // server ignored the range: start over
        RandomAccessFile(part, "rw").use { out ->
          out.setLength(have)
          out.seek(have)
          conn.inputStream.use { input ->
            val buf = ByteArray(1 shl 16)
            var lastPct = -1
            while (true) {
              if (cancel) throw InterruptedException("cancelled")
              val n = input.read(buf)
              if (n < 0) break
              out.write(buf, 0, n)
              have += n
              val pct = (have * 100 / MODEL_BYTES).toInt()
              if (pct != lastPct) {
                lastPct = pct
                notifyListeners("progress", JSObject().apply { put("loaded", have); put("total", MODEL_BYTES) })
              }
            }
          }
        }
        if (part.length() != MODEL_BYTES) throw IllegalStateException("Download incomplete (${part.length()} of $MODEL_BYTES bytes)")
        part.renameTo(model)
        call.resolve()
      } catch (e: Exception) {
        call.reject(if (cancel) "Cancelled" else (e.message ?: "Download failed"))
      } finally {
        downloading = false
        call.setKeepAlive(false)
      }
    }
  }

  @PluginMethod
  fun cancelDownload(call: PluginCall) {
    cancel = true
    call.resolve()
  }

  /** Loads the model, on the GPU where the phone allows, otherwise on the CPU. Takes ~10 s. */
  @PluginMethod
  fun load(call: PluginCall) {
    if (!model.exists()) return call.reject("Gemma isn't downloaded")
    io.execute {
      if (engine != null) return@execute call.resolve(JSObject().put("backend", backendName))
      for ((name, backend) in listOf("GPU" to Backend.GPU(), "CPU" to Backend.CPU())) {
        try {
          val e = Engine(EngineConfig(modelPath = model.path, backend = backend, maxNumTokens = 4096, cacheDir = context.cacheDir.path))
          e.initialize()
          engine = e
          backendName = name
          return@execute call.resolve(JSObject().put("backend", name))
        } catch (t: Throwable) {
          // try the next backend
        }
      }
      call.reject("Gemma couldn't start on this phone")
    }
  }

  /** One prompt, one reply. With a JSON schema, the reply is constrained to it. */
  @PluginMethod
  fun generate(call: PluginCall) {
    val e = engine ?: return call.reject("Gemma isn't loaded")
    val system = call.getString("system") ?: ""
    val prompt = call.getString("prompt") ?: return call.reject("No prompt")
    val schema = call.getString("schema")
    io.execute {
      try {
        val config =
          ConversationConfig(
            systemInstruction = Contents.of(system),
            samplerConfig = SamplerConfig(topK = 1, topP = 1.0, temperature = 0.0),
            enableResponseFormat = schema != null,
          )
        e.createConversation(config).use { conv ->
          val reply = conv.sendMessage(prompt, maxOutputToken = 2048, responseFormat = schema?.let { ResponseFormat.json(it) })
          call.resolve(JSObject().put("text", reply.toString()))
        }
      } catch (t: Throwable) {
        call.reject(t.message ?: "Gemma failed")
      }
    }
  }

  @PluginMethod
  fun remove(call: PluginCall) {
    io.execute {
      engine?.close()
      engine = null
      backendName = null
      model.delete()
      part.delete()
      call.resolve()
    }
  }
}
