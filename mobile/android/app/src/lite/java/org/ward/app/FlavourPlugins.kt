package org.ward.app

import com.getcapacitor.Plugin

/**
 * The lite APK: no on-phone Gemma, so no native code and it installs on any phone. The web app
 * sees no GemmaPhone plugin and hides "Gemma on this phone" (apps/web/src/lib/phoneGemma.ts).
 */
object FlavourPlugins {
  @JvmField val all: List<Class<out Plugin>> = emptyList()
}
