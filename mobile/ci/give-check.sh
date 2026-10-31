#!/usr/bin/env bash
# "Give Ward to a friend" on the emulator (.github/workflows/android.yml, launch job).
#
# 1. Installs the debug APK (only debug builds have the check receiver) and makes the same copy
#    the share sheet gets, through GiveCheckReceiver.
# 2. Checks the copy is byte for byte the installed APK: the hash of the installed file, the
#    copy on disk, the copy read back through the FileProvider, and the plugin's own hash must
#    all match, the provider must report the APK MIME type, and the plugin's certificate
#    fingerprint must match apksigner's.
# 3. Plays the friend: pulls the copy off the "phone", uninstalls Ward, installs the copy and
#    opens it.
#
# What this can't do: a real Bluetooth or Quick Share transfer between two phones. The share
# sheet hands that to the system, which an emulator can't exercise.
#
# Usage: mobile/ci/give-check.sh Ward-debug.apk
set -euo pipefail

APK="${1:-Ward-debug.apk}"
PKG=org.ward.app
fail() { echo "::error::give-check: $*"; adb logcat -d > give-logcat.txt || true; exit 1; }

adb uninstall "$PKG" > /dev/null 2>&1 || true
adb install "$APK"
adb shell am start -W -n "$PKG/.MainActivity" > /dev/null
adb logcat -c
adb shell am broadcast -n "$PKG/.GiveCheckReceiver"

line=""
for _ in $(seq 1 60); do
  line=$(adb logcat -d -s WardGive:I | grep -m1 GIVE_CHECK || true)
  [ -n "$line" ] && break
  sleep 1
done
echo "$line"
case "$line" in *"GIVE_CHECK ok"*) ;; *) fail "the copy wasn't made" ;; esac

field() { echo "$line" | tr ' ' '\n' | tr -d '\r' | sed -n "s/^$1=//p"; }
norm() { tr -d ' :\r' | tr 'A-F' 'a-f'; }

installed_path=$(adb shell pm path "$PKG" | tr -d '\r' | sed -n 's/^package://p' | head -1)
installed=$(adb shell sha256sum "$installed_path" | awk '{print $1}')
name=$(field file)
on_disk=$(adb shell run-as "$PKG" sha256sum "cache/give/$name" | awk '{print $1}')
# build-tools label it "Signer #1", "V2 Signer:" or "Signer (minSdkVersion=…)"; print what we
# got so a format change is easy to see.
apksigner_out=$("$ANDROID_HOME"/build-tools/$(ls "$ANDROID_HOME"/build-tools | sort -V | tail -1)/apksigner verify --print-certs "$APK" 2>/dev/null)
echo "$apksigner_out" | grep -i "sha-256" || true
signer=$(echo "$apksigner_out" | sed -n 's/^.*[Ss]igner.*certificate SHA-256 digest: //p' | head -1 | norm)

echo "installed  $installed ($installed_path)"
echo "plugin     $(field apk)"
echo "copy       $(field copy)"
echo "on disk    $on_disk (cache/give/$name)"
echo "provider   $(field provider) ($(field type))"
echo "cert       $(field cert)"
echo "apksigner  $signer"

[ -n "$installed" ] || fail "couldn't hash the installed APK"
[[ "$name" == Ward-*.apk ]] || fail "unexpected file name $name"
[ "$(field split)" = "false" ] || fail "the emulator install is split"
[ "$(field apk)" = "$installed" ] || fail "plugin hash differs from the installed APK"
[ "$(field copy)" = "$installed" ] || fail "copy hash differs from the installed APK"
[ "$on_disk" = "$installed" ] || fail "copy on disk differs from the installed APK"
[ "$(field provider)" = "$installed" ] || fail "copy read through the FileProvider differs"
[ "$(field type)" = "application/vnd.android.package-archive" ] || fail "FileProvider gives type $(field type)"
[ -n "$signer" ] && [ "$(field cert | norm)" = "$signer" ] || fail "certificate fingerprint differs from apksigner's"

# The friend's phone: the copy, and only the copy, installs and opens.
adb exec-out run-as "$PKG" cat "cache/give/$name" > friend.apk
[ "$(sha256sum friend.apk | awk '{print $1}')" = "$installed" ] || fail "pulled copy differs"
adb uninstall "$PKG"
adb install friend.apk
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity"
sleep 8
adb logcat -d > give-logcat.txt
adb shell pidof "$PKG" > /dev/null || fail "the friend's copy didn't stay open"
! grep -E "FATAL EXCEPTION.*org\.ward\.app|AndroidRuntime.*org\.ward\.app" give-logcat.txt || fail "the friend's copy crashed"
echo "give-check: the copy matches the installed APK and installs on a fresh phone"
