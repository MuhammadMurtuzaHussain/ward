package org.ward.app

import com.getcapacitor.Plugin

/** The gemma APK (arm64 only): adds Gemma 4 E2B on the phone through LiteRT-LM. */
object FlavourPlugins {
  @JvmField val all: List<Class<out Plugin>> = listOf(GemmaPhonePlugin::class.java)
}
