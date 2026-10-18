import 'dart:async';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'package:carbonlens_flutter/core/auth/phone_auth.dart';
import 'test_auth_service.dart';

// Test boundary only: never selected by application bootstrap.
class TestAccountService extends TestAuthService implements AccountAuthService {
  int sends = 0, confirms = 0, cancels = 0;
  int? lastResendToken;
  AuthFailure? confirmFailure;
  Completer<void>? confirmPending;
  void Function(PhoneChallenge)? sent;
  void Function(AuthFailure)? failed;
  void Function()? automatic, timeout;
  @override
  Future<void> requestPhone(
    String number,
    PhonePurpose purpose, {
    int? resendToken,
    required void Function(PhoneChallenge) codeSent,
    required void Function(AuthFailure) failed,
    required void Function() automatic,
    required void Function() timeout,
  }) async {
    sends++;
    lastResendToken = resendToken;
    sent = codeSent;
    this.failed = failed;
    this.automatic = automatic;
    this.timeout = timeout;
  }

  @override
  Future<void> confirmPhone(
    PhoneChallenge challenge,
    String code,
    PhonePurpose purpose,
  ) async {
    confirms++;
    if (confirmFailure != null) throw confirmFailure!;
    if (confirmPending != null) await confirmPending!.future;
    if (purpose == PhonePurpose.signIn) setUser('test-user');
  }

  @override
  void cancelPhone() {
    cancels++;
  }

  @override
  Future<void> linkGoogle() async {}
  @override
  Future<void> updateDisplayName(String value) async {}
  @override
  Future<void> changeEmail(String value) async {}
  @override
  Future<void> reauthenticateGoogle() async {}
  @override
  Future<void> reauthenticatePassword(String password) async {}
}
