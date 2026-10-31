#!/usr/bin/env bash
# Ward starts on the emulator (.github/workflows/android.yml, launch job): installs the APK, opens
# it with Wi-Fi and data off, then shares a WhatsApp export to it the way WhatsApp's share sheet
# does. Keeps launch.png, share.png and logcat.txt, and fails if Ward crashes or doesn't stay open.
#
# The package is read from the APK: org.ward.app for a release build, org.ward.app.debug for a
# debug one. The activity class is org.ward.app.MainActivity either way.
#
# Usage: mobile/ci/launch-check.sh Ward-android.apk
set -euo pipefail

APK="${1:-Ward-android.apk}"
tools="$ANDROID_HOME/build-tools/$(ls "$ANDROID_HOME"/build-tools | sort -V | tail -1)"
PKG=$("$tools"/aapt2 dump packagename "$APK")
MAIN="$PKG/org.ward.app.MainActivity"
fail() { echo "::error::launch-check: $*"; adb logcat -d > logcat.txt || true; exit 1; }
crashed() { grep -E "FATAL EXCEPTION.*org\.ward\.app|AndroidRuntime.*org\.ward\.app" logcat.txt; }

echo "launch-check: $APK is $PKG"
adb install -r "$APK"
adb shell svc wifi disable
adb shell svc data disable
adb logcat -c
adb shell am start -W -n "$MAIN"
sleep 30
adb exec-out screencap -p > launch.png
adb logcat -d > logcat.txt
adb shell pidof "$PKG" > /dev/null || fail "Ward didn't stay open"

# Share to Ward: hand it a WhatsApp export the way WhatsApp's share sheet does.
adb push packages/engine/fixtures/pileon-roman-urdu.txt "/data/local/tmp/WhatsApp Chat with 8B Science.txt"
adb shell chmod 644 "'/data/local/tmp/WhatsApp Chat with 8B Science.txt'"
adb shell am start -W -a android.intent.action.SEND -t text/plain --eu android.intent.extra.STREAM "'file:///data/local/tmp/WhatsApp Chat with 8B Science.txt'" -n "$MAIN"
sleep 10
adb exec-out screencap -p > share.png
adb logcat -d > logcat.txt
adb shell pidof "$PKG" > /dev/null || fail "Ward didn't stay open after a share"
! crashed || fail "Ward crashed"
echo "launch-check: Ward opened offline and took a shared chat without crashing"
