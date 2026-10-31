package org.ward.app

import androidx.core.content.FileProvider

/**
 * Hands out the APK copy for "Give Ward to a friend", and nothing else: its own class and
 * authority (`<applicationId>.give`) so its path config (res/xml/give_paths.xml) can be just
 * cache/give/, apart from Capacitor's general FileProvider.
 */
class GiveFileProvider : FileProvider()
