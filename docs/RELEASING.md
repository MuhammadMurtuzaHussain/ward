# Releasing Ward

This is for the owner, who holds Ward's Android signing key. CI builds and publishes a release,
but only after you've done steps 1 to 3 once, and only when you push a tag (step 5).

## What a release is

Pushing a tag like `v0.1.0` runs [`release.yml`](../.github/workflows/release.yml):

1. It stops straight away, naming what's missing, if any of the four signing secrets isn't set or
   the tag isn't a version.
2. [`android.yml`](../.github/workflows/android.yml) builds two signed release APKs and launches
   the lite one on an emulator with Wi-Fi off:
   - `Ward-android.apk`, the default "lite" flavour. It has no native code, so it installs on any
     Android 7+ phone, 32-bit Android Go phones included.
   - `Ward-android-gemma.apk`, which adds on-phone Gemma 4 E2B (LiteRT-LM). Its native library is
     arm64 only, so it installs only on 64-bit phones.

   CI checks each APK's native-library list, that Ward Lite's runtime and model are inside both,
   that neither is debug-signed, and that both have the tag's version and the same certificate.
3. [`desktop.yml`](../.github/workflows/desktop.yml) builds and launch-tests the macOS (Apple
   Silicon and Intel), Windows and Linux installers. They aren't code-signed yet.
4. It publishes a GitHub **prerelease** with all six files, a `SHA256SUMS` file, and the signing
   certificate's SHA-256 in the release notes, grouped in fours the way Ward shows it under
   "Give Ward to a friend".

Versions come from the tag. `vMAJOR.MINOR.PATCH` gives Android `versionName` MAJOR.MINOR.PATCH
and `versionCode` MAJOR × 10000 + MINOR × 100 + PATCH, so `v0.1.0` is 100 and each tag must be
higher than the last. MINOR and PATCH must stay under 100. A suffix such as `v0.1.0-rc.1` is kept
in the name but shares the code with `v0.1.0`. The desktop apps take the same version. A build
from anything but a tag is `0.0.0-dev`.

Debug builds are a separate app, `org.ward.app.debug`, so trying one never means uninstalling a
release (which would wipe the child's vault, since cloud backup is off).

## Before the first release

- Ward Lite works in a CI-built APK on a real phone: run "Android app" by hand from the Actions
  tab, install `Ward-android.apk` from the run's artifacts, and check a chat with the internet off.
- The lite APK installs and runs on a real 32-bit phone, ideally an Android Go phone with 2 to
  3 GB of RAM. CI can't test this: its emulator is 64-bit.
- CI is green on `main`.

## 1. Create the signing key (once, ever)

Do this on your own computer, in a folder that isn't synced to iCloud, Google Drive or Dropbox
(on a Mac, Desktop and Documents often are). You need `keytool`, which comes with any JDK 21.

```bash
mkdir -p ~/ward-signing && cd ~/ward-signing
openssl rand -base64 24   # the keystore password: save it in your password manager now
keytool -genkeypair -v -storetype PKCS12 -keystore ward-release.p12 -alias ward \
  -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=Ward, O=Ward"
```

`keytool` asks for the password twice: paste the one you generated. A PKCS12 keystore uses the
same password for the key, so `ANDROID_KEY_PASSWORD` below is that same password.

Write down the certificate's SHA-256. Every genuine Ward APK will carry exactly this fingerprint:

```bash
keytool -list -v -keystore ward-release.p12 -alias ward | grep SHA256
```

## 2. Back it up twice, offline

If the key is lost, no future Ward can update the copies already on children's phones: they
would have to uninstall, and that deletes the vault. If it leaks, anyone can sign a fake Ward that
passes the fingerprint check. So:

- Copy `ward-release.p12` to **two** encrypted USB drives (on a Mac, format them as APFS
  (Encrypted) in Disk Utility). Keep them in two different buildings, never with the laptop.
- Keep the password apart from the drives: in your password manager and on paper in a sealed
  envelope with one of them.
- Check each backup really works:

  ```bash
  shasum -a 256 ~/ward-signing/ward-release.p12 /Volumes/<drive>/ward-release.p12
  keytool -list -keystore /Volumes/<drive>/ward-release.p12 -alias ward
  ```

- Name a second custodian who knows where one drive and the envelope are.
- Never commit the keystore (`.gitignore` blocks `*.p12`, `*.jks` and `*.keystore`), email it, or
  put it in a chat.

## 3. Add the four secrets

With the [GitHub CLI](https://cli.github.com) logged in as the repository owner:

```bash
cd ~/ward-signing
base64 -i ward-release.p12 | gh secret set ANDROID_KEYSTORE_BASE64 --repo MuhammadMurtuzaHussain/ward
gh secret set ANDROID_KEYSTORE_PASSWORD --repo MuhammadMurtuzaHussain/ward   # paste the password when asked
gh secret set ANDROID_KEY_ALIAS --repo MuhammadMurtuzaHussain/ward --body ward
gh secret set ANDROID_KEY_PASSWORD --repo MuhammadMurtuzaHussain/ward        # the same password again
gh secret list --repo MuhammadMurtuzaHussain/ward                            # all four should be listed
```

Once both backups are checked, delete the working copy: `rm ~/ward-signing/ward-release.p12`.

## 4. Try a signed build (no release)

Run the Android workflow by hand. With the secrets set it now builds release-signed APKs,
versioned `0.0.0-dev`:

```bash
gh workflow run android.yml --repo MuhammadMurtuzaHussain/ward --ref main
gh run watch --repo MuhammadMurtuzaHussain/ward $(gh run list --repo MuhammadMurtuzaHussain/ward --workflow android.yml --limit 1 --json databaseId -q '.[0].databaseId')
```

The "Build" step prints each APK's certificate SHA-256: it must match the one from step 1. You can
install this APK on a test phone; the tagged release will update it in place.

## 5. Tag the release

```bash
git switch main && git pull
git tag -a v0.1.0 -m "Ward 0.1.0 (preview)"
git push origin v0.1.0
gh run watch --repo MuhammadMurtuzaHussain/ward $(gh run list --repo MuhammadMurtuzaHussain/ward --workflow release.yml --limit 1 --json databaseId -q '.[0].databaseId')
```

If the run fails before publishing, fix the cause on `main`, then move the tag and push it again:

```bash
git push --delete origin v0.1.0 && git tag -d v0.1.0
git tag -a v0.1.0 -m "Ward 0.1.0 (preview)" && git push origin v0.1.0
```

Once a release is published, never move its tag: fix forward with `v0.1.1`.

## 6. After it's published

- The release page has six files plus `SHA256SUMS`, and the fingerprint in the notes is the one
  from step 1.
- Install `Ward-android.apk` on a phone from the release page. Me → Give Ward to a friend shows
  the same fingerprint boxes.
- A prerelease is never GitHub's "latest" release, so `releases/latest` links don't find it.
  The README's commented-out download badges and the "Give Ward" QR code
  (`apps/web/src/lib/giveWard.ts`) use `releases/latest`: point them at `releases` (or this tag)
  while every release is a prerelease, or publish a release that isn't marked prerelease.
- Then replace the README's "No release yet" line with the download badges.

## Not done yet

- The desktop installers aren't signed (macOS Developer ID, Windows via SignPath). The README
  explains how to open them anyway.
- No Google Play listing. If Ward goes on Play, choose "use my own key" when enrolling in Play
  App Signing, so this same key stays Ward's identity; that choice can't be undone.
