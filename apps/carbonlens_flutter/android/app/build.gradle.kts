import java.util.Base64

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.carbonlens_flutter"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Register this exact existing application ID in the intended Firebase project.
        applicationId = "com.example.carbonlens_flutter"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 24
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

// Flutter passes each Dart define as a comma-separated Base64 value. Match
// AppConfig's default and last-definition-wins behavior without logging config.
val authMode = try {
    providers.gradleProperty("dart-defines").orNull
        ?.split(',')
        ?.filter { it.isNotEmpty() }
        ?.map { String(Base64.getDecoder().decode(it), Charsets.UTF_8) }
        ?.lastOrNull { it.startsWith("AUTH_MODE=") }
        ?.substringAfter('=') ?: "demo"
} catch (_: IllegalArgumentException) {
    throw GradleException("Invalid Dart build definitions. Check the Flutter launch arguments.")
}
require(authMode == "demo" || authMode == "firebase") {
    "AUTH_MODE must be demo or firebase."
}

// A Firebase file for another environment must not break a local demo build.
// Preserve it; only Firebase mode generates/validates Google Services resources.
if (authMode == "firebase") {
    require(file("google-services.json").exists() || file("src/debug/google-services.json").exists()) {
        "Firebase mode requires the matching Android google-services.json. See docs/firebase-signin-setup.md."
    }
    apply(plugin = "com.google.gms.google-services")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

// firebase_core / firebase_auth / firebase_app_check supply the native Firebase
// BoM and SDK dependencies through their locked FlutterFire Gradle projects.
// Google Services is versioned once in android/settings.gradle.kts and applied
// above for Firebase mode. Authentication does not require Firebase Analytics.
