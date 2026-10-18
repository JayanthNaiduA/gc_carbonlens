class ConfigurationFailure implements Exception {
  const ConfigurationFailure(this.message);
  final String message;
}

class AppConfig {
  const AppConfig({
    this.authMode = 'demo',
    this.apiKey = '',
    this.appId = '',
    this.messagingSenderId = '',
    this.projectId = '',
    this.authDomain = '',
    this.storageBucket = '',
    this.googleServerClientId = '',
    this.apiBaseUrl = '',
    this.webAppCheckSiteKey = '',
    this.appCheckDebug = false,
    this.useAuthEmulator = false,
    this.authEmulatorHost = '10.0.2.2',
    this.authEmulatorPort = 9099,
  });

  factory AppConfig.fromEnvironment() => const AppConfig(
    authMode: String.fromEnvironment('AUTH_MODE', defaultValue: 'demo'),
    apiKey: String.fromEnvironment('FIREBASE_API_KEY'),
    appId: String.fromEnvironment('FIREBASE_APP_ID'),
    messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID'),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID'),
    authDomain: String.fromEnvironment('FIREBASE_AUTH_DOMAIN'),
    storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET'),
    googleServerClientId: String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID'),
    apiBaseUrl: String.fromEnvironment('API_BASE_URL'),
    webAppCheckSiteKey: String.fromEnvironment('APP_CHECK_WEB_SITE_KEY'),
    appCheckDebug: bool.fromEnvironment('APP_CHECK_DEBUG'),
    useAuthEmulator: bool.fromEnvironment('USE_AUTH_EMULATOR'),
    authEmulatorHost: String.fromEnvironment(
      'AUTH_EMULATOR_HOST',
      defaultValue: '10.0.2.2',
    ),
    authEmulatorPort: int.fromEnvironment(
      'AUTH_EMULATOR_PORT',
      defaultValue: 9099,
    ),
  );

  final String authMode;
  final String apiKey;
  final String appId;
  final String messagingSenderId;
  final String projectId;
  final String authDomain;
  final String storageBucket;
  final String googleServerClientId;
  final String apiBaseUrl;
  final String webAppCheckSiteKey;
  final bool appCheckDebug;
  final bool useAuthEmulator;
  final String authEmulatorHost;
  final int authEmulatorPort;

  bool get isDemo => authMode == 'demo';

  void validate({required bool isRelease, required bool isWeb}) {
    if (isRelease && appCheckDebug)
      throw const ConfigurationFailure(
        'App Check debug provider is prohibited in release builds.',
      );
    if (authMode != 'demo' && authMode != 'firebase') {
      throw const ConfigurationFailure('AUTH_MODE must be demo or firebase.');
    }
    if (isDemo) {
      if (isRelease) {
        throw const ConfigurationFailure(
          'Release builds require Firebase mode. Use a debug build for the local simulator.',
        );
      }
      if (apiBaseUrl.isNotEmpty || useAuthEmulator) {
        throw const ConfigurationFailure(
          'Demo mode cannot connect to a backend or Firebase Auth emulator.',
        );
      }
      return;
    }
    if ([
      apiKey,
      appId,
      messagingSenderId,
      projectId,
    ].any((value) => value.trim().isEmpty)) {
      throw const ConfigurationFailure(
        'Firebase configuration is incomplete. Fill the ignored local config file using your registered app settings.',
      );
    }
    if (isWeb && authDomain.isEmpty) {
      throw const ConfigurationFailure(
        'Web Firebase sign-in requires FIREBASE_AUTH_DOMAIN.',
      );
    }
    if (useAuthEmulator) {
      if (isRelease ||
          !projectId.startsWith('demo-') ||
          apiBaseUrl.isNotEmpty) {
        throw const ConfigurationFailure(
          'Auth emulator mode requires a demo- project, a debug build and no production backend.',
        );
      }
      if (!['10.0.2.2', '127.0.0.1', 'localhost'].contains(authEmulatorHost) ||
          authEmulatorPort < 1 ||
          authEmulatorPort > 65535) {
        throw const ConfigurationFailure(
          'Use a local Auth emulator host and valid port.',
        );
      }
    }
    if (apiBaseUrl.isNotEmpty) {
      final uri = Uri.tryParse(apiBaseUrl);
      if (uri == null ||
          uri.scheme != 'https' ||
          uri.host.isEmpty ||
          uri.userInfo.isNotEmpty ||
          uri.hasQuery ||
          uri.hasFragment) {
        throw const ConfigurationFailure(
          'The protected API must use an HTTPS URL without credentials, query or fragment.',
        );
      }
      if (isWeb && webAppCheckSiteKey.isEmpty) {
        throw const ConfigurationFailure(
          'Configure web App Check before enabling protected API access.',
        );
      }
    }
  }
}
