import 'dart:convert';
import 'dart:typed_data';
import '../api/api_client.dart';
import '../api/api_errors.dart';
import '../api/transport.dart';

typedef BinaryTransport =
    Future<(int, String)> Function(Uri, Map<String, String>, Uint8List);

class EvidenceUploader {
  EvidenceUploader(this.bucket, this.credentials, {BinaryTransport? transport})
    : transport = transport ?? sendBytes;
  final String bucket;
  final ApiCredentials credentials;
  final BinaryTransport transport;

  Future<String> upload(
    String uid,
    String operation,
    Uint8List image,
    String type,
  ) async {
    if (!RegExp(r'^[a-z0-9][a-z0-9._-]+$').hasMatch(bucket))
      throw const ApiFailure(
        'STORAGE_NOT_CONFIGURED',
        'Private photo storage is not configured.',
      );
    if (image.isEmpty ||
        image.length > 10 * 1024 * 1024 ||
        !['image/jpeg', 'image/png'].contains(type)) {
      throw const ApiFailure(
        'INVALID_IMAGE',
        'Choose a JPEG or PNG smaller than 10 MiB.',
      );
    }
    final headers = await credentials.headers(idempotencyKey: operation);
    if (credentials.auth.currentUser?.uid != uid)
      throw const ApiFailure(
        'SESSION_CHANGED',
        'Sign in again before uploading evidence.',
      );
    final object =
        'users/$uid/scans/$operation/photo.${type == 'image/png' ? 'png' : 'jpg'}';
    final boundary = 'carbonlens_$operation';
    final metadata = {
      'name': object,
      'contentType': type,
      'metadata': {'uid': uid},
    };
    final bytes = BytesBuilder(copy: false)
      ..add(
        utf8.encode(
          '--$boundary\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${jsonEncode(metadata)}\r\n--$boundary\r\nContent-Type: $type\r\n\r\n',
        ),
      )
      ..add(image)
      ..add(utf8.encode('\r\n--$boundary--'));
    final token = headers['Authorization']!.substring(7);
    final uploadHeaders = {
      ...headers,
      'Authorization': 'Firebase $token',
      'Content-Type': 'multipart/related; boundary=$boundary',
      'X-Goog-Upload-Protocol': 'multipart',
    };
    try {
      final (status, response) = await transport(
        Uri.https('firebasestorage.googleapis.com', '/v0/b/$bucket/o', {
          'name': object,
        }),
        uploadHeaders,
        bytes.takeBytes(),
      );
      if (status == 401)
        throw const ApiFailure(
          'UNAUTHENTICATED',
          'Your session expired. Sign in again.',
          status: 401,
        );
      if (status < 200 || status >= 300)
        throw const ApiFailure(
          'UPLOAD_FAILED',
          'Private upload failed. Check your connection and storage configuration.',
          retryable: true,
        );
      final returned = jsonDecode(response);
      if (returned is! Map || returned['name'] != object)
        throw const ApiFailure(
          'INVALID_RESPONSE',
          'The upload could not be confirmed.',
        );
      // Never retain download tokens or create a public evidence URL.
      return object;
    } on ApiFailure {
      rethrow;
    } catch (_) {
      throw const ApiFailure(
        'UPLOAD_FAILED',
        'Private upload could not finish. Retry when connected.',
        retryable: true,
      );
    }
  }
}
