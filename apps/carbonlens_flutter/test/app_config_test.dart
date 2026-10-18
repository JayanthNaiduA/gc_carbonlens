import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/config/app_config.dart';

void main() {
  test('release rejects App Check debug attestations', () {
    expect(
      () => const AppConfig(
        authMode: 'firebase',
        appCheckDebug: true,
        apiKey: 'TEST_ONLY',
        appId: 'TEST_ONLY',
        messagingSenderId: 'TEST_ONLY',
        projectId: 'test-project',
      ).validate(isRelease: true, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
  });
  test('local demo is allowed only for debug without a backend', () {
    const AppConfig().validate(isRelease: false, isWeb: false);
    expect(
      () => const AppConfig().validate(isRelease: true, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
    expect(
      () => const AppConfig(
        apiBaseUrl: 'https://api.example.com',
      ).validate(isRelease: false, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
  });
  test('unknown mode and incomplete Firebase config fail visibly', () {
    expect(
      () => const AppConfig(
        authMode: 'unknown',
      ).validate(isRelease: false, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
    expect(
      () => const AppConfig(
        authMode: 'firebase',
      ).validate(isRelease: false, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
  });
  test('Auth emulator cannot use a real project, release or backend', () {
    const config = AppConfig(
      authMode: 'firebase',
      apiKey: 'TEST_ONLY',
      appId: 'TEST_ONLY',
      messagingSenderId: 'TEST_ONLY',
      projectId: 'real-project',
      useAuthEmulator: true,
    );
    expect(
      () => config.validate(isRelease: false, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
  });
  test('protected backend requires HTTPS and web App Check', () {
    const config = AppConfig(
      authMode: 'firebase',
      apiKey: 'TEST_ONLY',
      appId: 'TEST_ONLY',
      messagingSenderId: 'TEST_ONLY',
      projectId: 'test-project',
      authDomain: 'test-project.firebaseapp.com',
      apiBaseUrl: 'http://api.example.com',
    );
    expect(
      () => config.validate(isRelease: false, isWeb: false),
      throwsA(isA<ConfigurationFailure>()),
    );
    const webConfig = AppConfig(
      authMode: 'firebase',
      apiKey: 'TEST_ONLY',
      appId: 'TEST_ONLY',
      messagingSenderId: 'TEST_ONLY',
      projectId: 'test-project',
      authDomain: 'test-project.firebaseapp.com',
      apiBaseUrl: 'https://api.example.com',
    );
    expect(
      () => webConfig.validate(isRelease: false, isWeb: true),
      throwsA(isA<ConfigurationFailure>()),
    );
  });
}
