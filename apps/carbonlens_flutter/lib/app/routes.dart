import 'package:flutter/material.dart';
import '../core/auth/auth_controller.dart';
import '../features/auth/auth_screen.dart';
import '../features/consent/consent_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../core/api/api_client.dart';
import '../core/api/carbonlens_repository.dart';
import '../core/api/demo_repository.dart';
import '../core/config/app_config.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'theme.dart';
import '../features/profile/session_gate.dart';

class AppRoutes {
  static const login = '/login';
  static const consent = '/consent';
  static const home = '/home';
}

class CarbonLensApp extends StatelessWidget {
  const CarbonLensApp({
    super.key,
    required this.auth,
    this.repository,
    this.config = const AppConfig(),
  });
  final AuthController auth;
  final CarbonLensRepository? repository;
  final AppConfig config;

  @override
  Widget build(BuildContext context) {
    final data =
        repository ??
        (auth.isDemo
            ? DemoRepository()
            : config.apiBaseUrl.isEmpty
            ? UnconfiguredRepository()
            : RemoteCarbonLensRepository(
                ApiClient(
                  config.apiBaseUrl,
                  ApiCredentials(
                    auth.service,
                    appCheckToken: () => FirebaseAppCheck.instance.getToken(),
                  ),
                ),
              ));
    return MaterialApp(
      title: 'CarbonLens',
      debugShowCheckedModeBanner: false,
      theme: carbonLensTheme(),
      home: AnimatedBuilder(
        animation: auth,
        builder: (context, _) {
          if (auth.user == null) return AuthScreen(controller: auth);
          if (!auth.isDemo)
            return SessionGate(
              key: ValueKey('session-${auth.user!.uid}'),
              auth: auth,
              repository: data,
              storageBucket: config.storageBucket,
            );
          if (auth.consent == null)
            return ConsentScreen(
              key: ValueKey('consent-${auth.user!.uid}'),
              controller: auth,
              repository: data is UnconfiguredRepository ? null : data,
            );
          return DashboardScreen(
            key: ValueKey('home-${auth.user!.uid}'),
            controller: auth,
            repository: data,
            storageBucket: config.storageBucket,
          );
        },
      ),
    );
  }
}
