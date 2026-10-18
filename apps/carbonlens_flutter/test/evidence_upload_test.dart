import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/storage/evidence_upload.dart';
import 'package:carbonlens_flutter/core/api/api_client.dart';
import 'package:carbonlens_flutter/core/api/api_errors.dart';
import 'package:carbonlens_flutter/core/auth/demo_auth_service.dart';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'helpers/test_auth_service.dart';

void main() {
  test(
    'private multipart upload uses owner path, Firebase auth and App Check',
    () async {
      final auth = TestAuthService()..setUser('test-user');
      addTearDown(auth.dispose);
      var requests = 0;
      final uploader = EvidenceUploader(
        'test-bucket',
        ApiCredentials(
          auth,
          appCheckToken: () async => 'TEST_ONLY_ATTESTATION',
        ),
        transport: (uri, headers, body) async {
          requests++;
          expect(uri.host, 'firebasestorage.googleapis.com');
          expect(
            uri.queryParameters['name'],
            'users/test-user/scans/stable-key/photo.jpg',
          );
          expect(headers['Authorization'], 'Firebase TEST_ONLY_ID_TOKEN');
          expect(headers['X-Firebase-AppCheck'], 'TEST_ONLY_ATTESTATION');
          expect(headers['X-Goog-Upload-Protocol'], 'multipart');
          expect(utf8.decode(body), contains('"uid":"test-user"'));
          return (
            200,
            '{"name":"users/test-user/scans/stable-key/photo.jpg","downloadTokens":"TEST_ONLY_DO_NOT_RETAIN"}',
          );
        },
      );
      expect(
        await uploader.upload(
          'test-user',
          'stable-key',
          Uint8List.fromList([1, 2, 3]),
          'image/jpeg',
        ),
        'users/test-user/scans/stable-key/photo.jpg',
      );
      expect(requests, 1);
      await expectLater(
        uploader.upload(
          'other-user',
          'stable-key',
          Uint8List.fromList([1]),
          'image/jpeg',
        ),
        throwsA(isA<ApiFailure>()),
      );
      expect(requests, 1);
    },
  );
  test('demo and invalid images cannot reach storage', () async {
    final demo = DemoAuthService();
    await demo.continueAsDemo();
    addTearDown(demo.dispose);
    var requests = 0;
    final uploader = EvidenceUploader(
      'test-bucket',
      ApiCredentials(demo, appCheckToken: () async => null),
      transport: (uri, headers, body) async {
        requests++;
        return (200, '{}');
      },
    );
    await expectLater(
      uploader.upload(
        'demo',
        'test-key',
        Uint8List.fromList([1]),
        'image/jpeg',
      ),
      throwsA(isA<AuthFailure>()),
    );
    await expectLater(
      uploader.upload('demo', 'test-key', Uint8List(0), 'image/jpeg'),
      throwsA(isA<ApiFailure>()),
    );
    expect(requests, 0);
  });
}
