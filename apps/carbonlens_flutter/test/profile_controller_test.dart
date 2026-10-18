import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/api/api_errors.dart';
import 'package:carbonlens_flutter/core/auth/auth_controller.dart';
import 'package:carbonlens_flutter/core/profile/profile_controller.dart';
import 'helpers/test_auth_service.dart';
import 'helpers/test_profile_repository.dart';

void main() {
  Future<void> flush() => Future<void>.delayed(Duration.zero);
  test(
    'failed profile save remains incomplete and retries reuse the operation key',
    () async {
      final service = TestAuthService()..setUser('test-user');
      final auth = AuthController(service);
      final repository = TestProfileRepository();
      final profile = ProfileController(auth, repository);
      addTearDown(profile.dispose);
      addTearDown(auth.dispose);
      await flush();
      expect(profile.profile!.complete, isFalse);
      repository.saveFailure = const ApiFailure('UNAVAILABLE', 'Offline.');
      expect(await profile.save('John', 'IN'), isFalse);
      expect(profile.profile!.complete, isFalse);
      repository.saveFailure = null;
      expect(await profile.save('John', 'IN'), isTrue);
      expect(repository.keys[0], repository.keys[1]);
      expect(profile.profile!.complete, isTrue);
      expect(profile.profile!.region, 'IN');
    },
  );
  test(
    'logout drops profile and stale requests cannot populate another account',
    () async {
      final service = TestAuthService()..setUser('user-a');
      final auth = AuthController(service);
      final repository = TestProfileRepository(uid: 'user-a')
        ..pendingLoad = Completer<Map<String, dynamic>>();
      final old = repository.pendingLoad!;
      final profile = ProfileController(auth, repository);
      addTearDown(profile.dispose);
      addTearDown(auth.dispose);
      repository.pendingLoad = null;
      repository.uid = 'user-b';
      service.setUser('user-b');
      await flush();
      old.complete({'uid': 'user-a', 'profile_complete': true});
      await flush();
      expect(profile.profile!.uid, 'user-b');
      await auth.signOut();
      expect(profile.profile, isNull);
    },
  );
  test(
    'duplicate saves are blocked and an in-flight save cannot survive logout',
    () async {
      final service = TestAuthService()..setUser('test-user');
      final auth = AuthController(service);
      final repository = TestProfileRepository();
      final profile = ProfileController(auth, repository);
      addTearDown(profile.dispose);
      addTearDown(auth.dispose);
      await flush();
      repository.pendingSave = Completer<Map<String, dynamic>>();
      final pending = profile.save('John', 'IN');
      expect(await profile.save('John', 'IN'), isFalse);
      expect(repository.saves, 1);
      await auth.signOut();
      repository.pendingSave!.complete({
        ...repository.record,
        'profile_complete': true,
      });
      expect(await pending, isFalse);
      expect(profile.profile, isNull);
    },
  );
  test(
    'wrong-owner response is rejected and revoked sessions return to sign-in',
    () async {
      final service = TestAuthService()..setUser('test-user');
      final auth = AuthController(service);
      final repository = TestProfileRepository(uid: 'other-user');
      final profile = ProfileController(auth, repository);
      addTearDown(profile.dispose);
      addTearDown(auth.dispose);
      await flush();
      expect(profile.profile, isNull);
      expect(profile.error, contains('verified'));
      repository.loadFailure = const ApiFailure(
        'TOKEN_REVOKED',
        'Sign in again.',
        status: 401,
      );
      await profile.load();
      expect(auth.user, isNull);
      expect(profile.profile, isNull);
    },
  );
}
