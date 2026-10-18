# Native extras: home-screen widget and Live Activity

These files are **written but not compiled or tested here** (this project was built without
Xcode or the Android SDK). They are kept out of the `ios/` and `android/` projects so they can't
break your builds. Add them by following the steps below, then build and test on a device.

The game already sends the data: `src/widget.ts` calls a Capacitor plugin named `SushiWidget`
whenever the tip jar, the restaurant or the calendar changes. Until the plugin exists, those calls
do nothing.

## iOS (Xcode)

1. **App Group:** in the App target → Signing & Capabilities → **+ App Groups** → add
   `group.com.arictan.sushistack` (change it in `SushiWidgetShared.swift` if you use another).
2. **Plugin:** drag `ios/SushiWidgetPlugin.swift`, `ios/SushiWidgetShared.swift` and
   `ios/MainViewController.swift` into the App target. In `Main.storyboard`, set the view
   controller's custom class to `MainViewController` (module `App`).
3. **Widget extension:** File → New → Target → **Widget Extension**, name it `SushiWidgetExtension`,
   tick **Include Live Activity**. Replace the generated Swift with `ios/SushiWidgetExtension/SushiWidget.swift`
   and add `SushiWidgetShared.swift` to this target too. Give the extension the same App Group.
4. **Live Activities:** in the App's `Info.plist` add `NSSupportsLiveActivities` = YES.
5. Set the extension's deployment target to iOS 17 (the code uses `containerBackground`), build,
   then long-press the home screen → **+** → Sushi Stack.

## Android (Android Studio)

1. Copy `android/java/*.java` into `android/app/src/main/java/com/arictan/sushistack/`.
2. Copy `android/res/layout`, `android/res/xml` and `android/res/drawable` files into
   `android/app/src/main/res/` (same folder names).
3. In `MainActivity.java`, register the plugin before `super.onCreate`:
   ```java
   @Override
   public void onCreate(Bundle savedInstanceState) {
       registerPlugin(SushiWidgetPlugin.class);
       super.onCreate(savedInstanceState);
   }
   ```
4. In `AndroidManifest.xml`, inside `<application>`:
   ```xml
   <receiver android:name=".SushiWidgetProvider" android:exported="false">
       <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
       <meta-data android:name="android.appwidget.provider" android:resource="@xml/sushi_widget_info" />
   </receiver>
   ```
5. Build, then long-press the home screen → Widgets → Sushi Stack.

Live Activities are iOS-only; on Android the same calls resolve and do nothing.
