import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/api/api_client.dart';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'package:carbonlens_flutter/core/auth/demo_auth_service.dart';
import 'helpers/test_auth_service.dart';

void main() {
  test(
    'local Auth emulator sessions cannot issue protected API headers',
    () async {
      final auth = TestAuthService()..emulated = true;
      auth.setUser('test-user');
      addTearDown(auth.dispose);
      final credentials = ApiCredentials(
        auth,
        appCheckToken: () async => 'TEST_ONLY_ATTESTATION',
      );
      await expectLater(credentials.headers(), throwsA(isA<AuthFailure>()));
    },
  );
  test(
    'operation identifiers cannot contain header control characters',
    () async {
      final auth = TestAuthService()..setUser('test-user');
      addTearDown(auth.dispose);
      final credentials = ApiCredentials(
        auth,
        appCheckToken: () async => 'TEST_ONLY_ATTESTATION',
      );
      await expectLater(
        credentials.headers(idempotencyKey: 'invalid\r\nheader'),
        throwsA(
          isA<AuthFailure>().having(
            (failure) => failure.code,
            'code',
            'invalid-idempotency-key',
          ),
        ),
      );
    },
  );
  test(
    'demo session never requests an App Check token or issues API headers',
    () async {
      final demo = DemoAuthService();
      addTearDown(demo.dispose);
      await demo.continueAsDemo();
      var requests = 0;
      final credentials = ApiCredentials(
        demo,
        appCheckToken: () async {
          requests++;
          return null;
        },
      );
      await expectLater(credentials.headers(), throwsA(isA<AuthFailure>()));
      expect(requests, 0);
    },
  );
  test('both a Firebase session and App Check are required', () async {
    final auth = TestAuthService();
    addTearDown(auth.dispose);
    final credentials = ApiCredentials(auth, appCheckToken: () async => null);
    await expectLater(credentials.headers(), throwsA(isA<AuthFailure>()));
    auth.setUser('test-user');
    await expectLater(credentials.headers(), throwsA(isA<AuthFailure>()));
  });
  test(
    'authenticated headers carry attestation and unique request IDs',
    () async {
      final auth = TestAuthService()..setUser('test-user');
      addTearDown(auth.dispose);
      final credentials = ApiCredentials(
        auth,
        appCheckToken: () async => 'TEST_ONLY_ATTESTATION',
      );
      final first = await credentials.headers(idempotencyKey: 'test-operation');
      final second = await credentials.headers(
        idempotencyKey: 'test-operation',
      );
      expect(first['Authorization'], 'Bearer TEST_ONLY_ID_TOKEN');
      expect(first['X-Firebase-AppCheck'], 'TEST_ONLY_ATTESTATION');
      expect(first['Idempotency-Key'], second['Idempotency-Key']);
      expect(first['X-Request-Id'], isNot(second['X-Request-Id']));
    },
  );
}
