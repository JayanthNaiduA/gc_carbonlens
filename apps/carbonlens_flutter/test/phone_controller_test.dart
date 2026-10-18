import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'package:carbonlens_flutter/core/auth/phone_auth.dart';
import 'package:carbonlens_flutter/core/auth/phone_controller.dart';
import 'helpers/test_account_service.dart';

void main() {
  test('phone normalization validates E.164 and Indian national numbers', () {
    expect(normalizePhone('+91', '98765 43210'), '+919876543210');
    expect(normalizePhone('+91', '+1 (202) 555-0123'), '+12025550123');
    for (final value in [
      '123',
      '09876543210',
      'phone',
      '+00123456789',
      '1234567890',
      '+1234567890123456',
    ]) {
      expect(() => normalizePhone('+91', value), throwsA(isA<AuthFailure>()));
    }
  });
  testWidgets(
    'OTP requires SDK confirmation; invalid and failed codes do not authenticate',
    (tester) async {
      final service = TestAccountService();
      final controller = PhoneController(service, PhonePurpose.signIn);
      addTearDown(controller.dispose);
      addTearDown(service.dispose);
      await controller.send('+91', '9876543210');
      expect(controller.sending, isTrue);
      expect(controller.completed, isFalse);
      service.sent!(const PhoneChallenge('test-challenge', 7));
      await controller.verify('12');
      expect(service.confirms, 0);
      service.confirmFailure = const AuthFailure(
        'invalid-verification-code',
        'Wrong code.',
      );
      await controller.verify('123456');
      expect(controller.completed, isFalse);
      expect(service.currentUser, isNull);
      expect(controller.error, 'Wrong code.');
      service.confirmFailure = null;
      await controller.verify('123456');
      expect(controller.completed, isTrue);
      expect(service.currentUser?.uid, 'test-user');
    },
  );
  testWidgets('resend cooldown preserves token and blocks duplicate requests', (
    tester,
  ) async {
    final service = TestAccountService();
    final controller = PhoneController(service, PhonePurpose.signIn);
    addTearDown(controller.dispose);
    addTearDown(service.dispose);
    await controller.send('+91', '9876543210');
    service.sent!(const PhoneChallenge('test-challenge', 7));
    await controller.send('+91', '9876543210', resend: true);
    expect(service.sends, 1);
    await tester.pump(const Duration(seconds: 60));
    expect(controller.cooldown, 0);
    await controller.send('+91', '9876543210', resend: true);
    expect(service.sends, 2);
    expect(service.lastResendToken, 7);
    await tester.pump(const Duration(seconds: 60));
  });
  testWidgets(
    'timeout and throttling stay incomplete; back ignores stale callbacks',
    (tester) async {
      final service = TestAccountService();
      final controller = PhoneController(service, PhonePurpose.signIn);
      addTearDown(controller.dispose);
      addTearDown(service.dispose);
      await controller.send('+91', '9876543210');
      service.timeout!();
      expect(controller.completed, isFalse);
      expect(controller.notice, contains('timed out'));
      service.failed!(const AuthFailure('too-many-requests', 'Try later.'));
      expect(controller.error, 'Try later.');
      controller.backToNumber();
      service.sent!(const PhoneChallenge('stale', null));
      service.automatic!();
      expect(controller.challenge, isNull);
      expect(controller.completed, isFalse);
      expect(service.cancels, 1);
      await tester.pump(const Duration(seconds: 60));
    },
  );
  testWidgets(
    'automatic verification and duplicate manual submission are coordinated',
    (tester) async {
      final service = TestAccountService();
      final controller = PhoneController(service, PhonePurpose.link);
      addTearDown(controller.dispose);
      addTearDown(service.dispose);
      await controller.send('+91', '9876543210');
      service.sent!(const PhoneChallenge('test-challenge', null));
      service.confirmPending = Completer<void>();
      final pending = controller.verify('123456');
      await controller.verify('123456');
      controller.backToNumber();
      expect(controller.verifying, isTrue);
      expect(service.confirms, 1);
      service.confirmPending!.complete();
      await pending;
      expect(controller.completed, isTrue);
      service.failed!(
        const AuthFailure('network-request-failed', 'Late failure.'),
      );
      expect(controller.error, isNull);
    },
  );
  testWidgets(
    'automatic success completes without manual code; disposal ignores callbacks',
    (tester) async {
      final service = TestAccountService();
      final controller = PhoneController(service, PhonePurpose.signIn);
      addTearDown(service.dispose);
      await controller.send('+91', '9876543210');
      service.automatic!();
      expect(controller.completed, isTrue);
      controller.dispose();
      service.sent!(const PhoneChallenge('late', null));
      expect(controller.challenge, isNull);
    },
  );
}
