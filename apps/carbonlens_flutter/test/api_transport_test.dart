import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/api/api_client.dart';
import 'helpers/test_auth_service.dart';

void main() {
  test(
    'protected transport sends credentials and preserves operation key',
    () async {
      final auth = TestAuthService();
      await auth.signInWithEmail('john@example.com', 'dummy-password');
      // The helper may expose a demo service; use credentials tests for that guard.
      final credentials = ApiCredentials(
        auth,
        appCheckToken: () async => 'test-attestation',
      );
      final client = ApiClient(
        'https://example.com',
        credentials,
        transport: (uri, method, headers, body) async {
          expect(uri.path, '/v1/green-events');
          expect(headers['Idempotency-Key'], 'stable-key');
          expect(jsonDecode(body!)['action_type'], 'GO_GREEN_PRODUCT');
          return (200, '{"event_id":"test-event"}');
        },
      );
      final result = await client.request(
        'POST',
        '/v1/green-events',
        body: {'action_type': 'GO_GREEN_PRODUCT'},
        key: 'stable-key',
      );
      expect(result['event_id'], 'test-event');
      await auth.dispose();
    },
  );
}
