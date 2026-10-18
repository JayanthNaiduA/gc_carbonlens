import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/auth/auth_controller.dart';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'helpers/test_auth_service.dart';
import 'package:carbonlens_flutter/core/auth/demo_auth_service.dart';
import 'package:carbonlens_flutter/core/consent/consent_state.dart';

Future<void> flush() => Future<void>.delayed(Duration.zero);

void main() {
  test('demo has no token and sign-out clears consent', () async {
    final service = DemoAuthService();
    final controller = AuthController(service);
    addTearDown(controller.dispose);
    await controller.continueAsDemo();
    await flush();
    expect(controller.user!.isDemo, isTrue);
    expect(await service.idToken(), isNull);
    controller.acceptConsent(const ConsentState());
    expect(controller.consent!.acceptedAt, isNotNull);
    expect(controller.consent!.camera, isFalse);
    await controller.signOut();
    await flush();
    expect(controller.user, isNull);
    expect(controller.consent, isNull);
  });

  test('user changes never inherit another account consent', () {
    final service = TestAuthService();
    final controller = AuthController(service);
    addTearDown(controller.dispose);
    service.setUser('user-a');
    controller.acceptConsent(const ConsentState(location: true));
    service.setUser('user-b');
    expect(controller.consent, isNull);
  });

  test(
    'authentication failures reset busy and show only safe messages',
    () async {
      final service = TestAuthService()
        ..failure = const AuthFailure('invalid-credential', 'Sign-in failed.');
      final controller = AuthController(service);
      addTearDown(controller.dispose);
      expect(await controller.signIn('john@example.com', 'TEST_ONLY'), isFalse);
      expect(controller.busy, isFalse);
      expect(controller.error, 'Sign-in failed.');
      expect(controller.user, isNull);
    },
  );

  test(
    'duplicate submit is blocked while the first action is pending',
    () async {
      final service = TestAuthService()..pending = Completer<void>();
      final controller = AuthController(service);
      addTearDown(controller.dispose);
      final first = controller.signIn('john@example.com', 'TEST_ONLY');
      expect(await controller.signIn('john@example.com', 'TEST_ONLY'), isFalse);
      expect(service.signInCount, 1);
      service.pending!.complete();
      await first;
    },
  );
}
