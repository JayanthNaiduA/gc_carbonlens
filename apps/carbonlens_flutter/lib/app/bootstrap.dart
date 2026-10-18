import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import '../core/auth/auth_controller.dart';
import '../core/auth/demo_auth_service.dart';
import '../core/auth/firebase_auth_service.dart';
import '../core/config/app_config.dart';

class AppSession {
  const AppSession(this.config, this.auth);
  final AppConfig config;
  final AuthController auth;
}

Future<AppSession> bootstrapApp() async {
  final config = AppConfig.fromEnvironment();
  config.validate(isRelease: kReleaseMode, isWeb: kIsWeb);
  if (config.isDemo)
    return AppSession(config, AuthController(DemoAuthService()));
  if (!kIsWeb && defaultTargetPlatform != TargetPlatform.android) {
    throw const ConfigurationFailure(
      'This milestone supports Android and web Firebase sign-in.',
    );
  }

  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(
      options: FirebaseOptions(
        apiKey: config.apiKey,
        appId: config.appId,
        messagingSenderId: config.messagingSenderId,
        projectId: config.projectId,
        authDomain: config.authDomain.isEmpty ? null : config.authDomain,
        storageBucket: config.storageBucket.isEmpty
            ? null
            : config.storageBucket,
      ),
    );
  }
  final firebaseAuth = FirebaseAuth.instance;
  if (config.useAuthEmulator) {
    await firebaseAuth.useAuthEmulator(
      config.authEmulatorHost,
      config.authEmulatorPort,
    );
  }

  // Authentication can be tested before the backend exists.
  // Protected API configuration always requires App Check; never silently bypass it.
  if (config.apiBaseUrl.isNotEmpty) {
    if (kIsWeb) {
      await FirebaseAppCheck.instance.activate(
        providerWeb: ReCaptchaV3Provider(config.webAppCheckSiteKey),
      );
    } else {
      await FirebaseAppCheck.instance.activate(
        providerAndroid: config.appCheckDebug
            ? AndroidDebugProvider()
            : AndroidPlayIntegrityProvider(),
      );
    }
  }

  return AppSession(
    config,
    AuthController(
      FirebaseAuthService(
        firebaseAuth,
        googleServerClientId: config.googleServerClientId,
        useEmulator: config.useAuthEmulator,
      ),
    ),
  );
}
