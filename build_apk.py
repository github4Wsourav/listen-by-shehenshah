import os
import sys
import subprocess
import shutil
import zipfile

def build():
    print("=== STARTING LISTEN BY SHEHENSHAH APK BUILD PIPELINE ===")

    sdk_dir = os.path.expanduser(r'~\AppData\Local\Android\Sdk')
    android_jar = os.path.join(sdk_dir, 'platforms', 'android-37', 'android.jar')
    build_tools = os.path.join(sdk_dir, 'build-tools', '37.0.0')
    aapt2 = os.path.join(build_tools, 'aapt2.exe')
    d8 = os.path.join(build_tools, 'd8.bat')
    zipalign = os.path.join(build_tools, 'zipalign.exe')
    apksigner = os.path.join(build_tools, 'apksigner.bat')

    build_dir = os.path.abspath('android-build')
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(build_dir, exist_ok=True)

    # 1. Create directory structure
    res_dir = os.path.join(build_dir, 'res')
    res_drawable = os.path.join(res_dir, 'drawable')
    res_values = os.path.join(res_dir, 'values')
    assets_target = os.path.join(build_dir, 'assets')
    src_dir = os.path.join(build_dir, 'src', 'com', 'shehenshah', 'listen')
    bin_dir = os.path.join(build_dir, 'bin')

    for d in [res_drawable, res_values, assets_target, src_dir, bin_dir]:
        os.makedirs(d, exist_ok=True)

    # 2. Copy icon
    if os.path.exists('assets/icon.png'):
        shutil.copy('assets/icon.png', os.path.join(res_drawable, 'ic_launcher.png'))

    # 3. Create strings.xml
    with open(os.path.join(res_values, 'strings.xml'), 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">LISTEN by shehenshah</string>
</resources>
''')

    # 4. Create AndroidManifest.xml
    manifest_path = os.path.join(build_dir, 'AndroidManifest.xml')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.shehenshah.listen"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name="com.shehenshah.listen.MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
''')

    # 5. Copy Web Assets from src/renderer into Android assets
    renderer_dir = os.path.abspath('src/renderer')
    for item in os.listdir(renderer_dir):
        s = os.path.join(renderer_dir, item)
        d = os.path.join(assets_target, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)
    print("Copied web assets into Android build assets directory.")

    # 6. Write MainActivity.java
    java_file = os.path.join(src_dir, 'MainActivity.java')
    with open(java_file, 'w', encoding='utf-8') as f:
        f.write('''package com.shehenshah.listen;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.view.KeyEvent;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on during music playback
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
''')
    print("Created MainActivity.java")

    # 7. aapt2 compile resources
    compiled_res = os.path.join(build_dir, 'compiled_res.zip')
    cmd_aapt_compile = [aapt2, 'compile', '--dir', res_dir, '-o', compiled_res]
    print("Compiling resources with aapt2...")
    subprocess.run(cmd_aapt_compile, check=True)

    # 8. aapt2 link
    unaligned_apk = os.path.join(build_dir, 'unaligned.apk')
    cmd_aapt_link = [
        aapt2, 'link',
        '-I', android_jar,
        '--manifest', manifest_path,
        '-o', unaligned_apk,
        compiled_res,
        '-A', assets_target,
        '--auto-add-overlay'
    ]
    print("Linking APK with aapt2...")
    subprocess.run(cmd_aapt_link, check=True)

    # 9. Compile Java code
    print("Compiling Java code with javac...")
    javac_cmd = [
        'javac',
        '--release', '8',
        '-cp', android_jar,
        '-d', bin_dir,
        java_file
    ]
    subprocess.run(javac_cmd, check=True)

    # 10. Run d8 to convert .class to classes.dex
    print("Converting class files to Dalvik bytecode (classes.dex) with d8...")
    class_file = os.path.join(bin_dir, 'com', 'shehenshah', 'listen', 'MainActivity.class')
    cmd_d8 = [
        'cmd.exe', '/c', d8,
        '--lib', android_jar,
        '--output', bin_dir,
        class_file
    ]
    subprocess.run(cmd_d8, check=True)

    # 11. Add classes.dex into unaligned.apk
    dex_path = os.path.join(bin_dir, 'classes.dex')
    print("Adding classes.dex into APK package...")
    with zipfile.ZipFile(unaligned_apk, 'a', compression=zipfile.ZIP_DEFLATED) as z:
        z.write(dex_path, 'classes.dex')

    # 12. Run zipalign
    aligned_apk = os.path.join(build_dir, 'aligned.apk')
    print("Aligning APK with zipalign...")
    cmd_zipalign = [zipalign, '-f', '-p', '4', unaligned_apk, aligned_apk]
    subprocess.run(cmd_zipalign, check=True)

    # 13. Generate Keystore if not exists
    keystore = os.path.abspath('shehenshah.keystore')
    keytool = shutil.which('keytool') or r'C:\Program Files\Java\jdk-24\bin\keytool.exe'
    if not os.path.exists(keystore):
        print(f"Generating release keystore using {keytool}...")
        cmd_keytool = [
            keytool,
            '-genkeypair',
            '-keystore', keystore,
            '-storepass', 'shehenshah123',
            '-alias', 'shehenshah_key',
            '-keypass', 'shehenshah123',
            '-dname', 'CN=ShehenshahListen, OU=App, O=Shehenshah, L=City, S=State, C=IN',
            '-keyalg', 'RSA',
            '-keysize', '2048',
            '-validity', '10000'
        ]
        subprocess.run(cmd_keytool, check=True)

    # 14. Sign with apksigner
    final_apk = 'LISTEN-by-shehenshah.apk'
    print("Signing APK with apksigner...")
    cmd_apksign = [
        'cmd.exe', '/c', apksigner, 'sign',
        '--ks', keystore,
        '--ks-pass', 'pass:shehenshah123',
        '--key-pass', 'pass:shehenshah123',
        '--out', final_apk,
        aligned_apk
    ]
    subprocess.run(cmd_apksign, check=True)

    # 15. Verify signature
    print("Verifying APK signature...")
    cmd_verify = ['cmd.exe', '/c', apksigner, 'verify', final_apk]
    subprocess.run(cmd_verify, check=True)

    apk_size_mb = os.path.getsize(final_apk) / (1024 * 1024)
    print(f"\n==========================================")
    print(f"SUCCESS! Built: {final_apk} ({apk_size_mb:.2f} MB)")
    print(f"This APK can be installed on any Android phone!")
    print(f"==========================================")

if __name__ == '__main__':
    build()
