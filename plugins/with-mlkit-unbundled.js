// Pakai model OCR ML Kit yang diunduh Google Play Services (bukan yang
// dibundel di APK). Kelas Kotlin/Java-nya sama, jadi kode modul tidak berubah.
// Hemat sekitar belasan MB; konsekuensinya HP butuh Google Play Services dan
// internet saat model pertama kali diunduh.
const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

const MARK = '// splitz: mlkit-unbundled';
const GRADLE = `
${MARK}
configurations.all {
    exclude group: 'com.google.mlkit', module: 'text-recognition'
}
dependencies {
    implementation 'com.google.android.gms:play-services-mlkit-text-recognition:19.0.1'
}
`;

module.exports = function withMlkitUnbundled(config) {
  config = withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes(MARK)) c.modResults.contents += GRADLE;
    return c;
  });
  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app['meta-data'] = app['meta-data'] || [];
    const name = 'com.google.mlkit.vision.DEPENDENCIES';
    if (!app['meta-data'].some((m) => m.$['android:name'] === name)) {
      app['meta-data'].push({ $: { 'android:name': name, 'android:value': 'ocr' } });
    }
    return c;
  });
};
