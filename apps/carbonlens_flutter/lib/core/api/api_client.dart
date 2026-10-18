import 'dart:math';
import 'dart:async';
import 'dart:convert';
import '../auth/auth_service.dart';
import 'api_errors.dart';
import 'transport.dart';

/// Credentials are acquired per request and never persisted or logged.
class ApiCredentials {
  ApiCredentials(this.auth, {required this.appCheckToken});
  final AuthService auth;
  final Future<String?> Function() appCheckToken;

  Future<Map<String, String>> headers({String? idempotencyKey}) async {
    if (idempotencyKey != null &&
        !RegExp(r'^[A-Za-z0-9_-]{1,128}$').hasMatch(idempotencyKey)) {
      throw const AuthFailure(
        'invalid-idempotency-key',
        'Use a valid stable operation identifier.',
      );
    }
    if (auth.isDemo ||
        auth.usesAuthEmulator ||
        auth.currentUser?.isDemo == true) {
      throw const AuthFailure(
        'demo-api-blocked',
        'Demo sessions cannot access protected APIs.',
      );
    }
    if (auth.currentUser == null)
      throw const AuthFailure(
        'signed-out',
        'Sign in before accessing this feature.',
      );
    final token = await auth.idToken();
    final attestation = await appCheckToken();
    if (token == null ||
        token.isEmpty ||
        attestation == null ||
        attestation.isEmpty) {
      throw const AuthFailure(
        'credentials-missing',
        'Authentication and App Check are required.',
      );
    }
    return {
      'Authorization': 'Bearer $token',
      'X-Firebase-AppCheck': attestation,
      'X-Request-Id': _uuid(),
      'Content-Type': 'application/json',
      if (idempotencyKey != null) 'Idempotency-Key': idempotencyKey,
    };
  }

  String _uuid() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }
}

typedef JsonTransport =
    Future<(int, String)> Function(Uri, String, Map<String, String>, String?);

class ApiClient {
  ApiClient(this.baseUrl, this.credentials, {JsonTransport? transport})
    : transport = transport ?? sendJson {
    final base = Uri.parse(baseUrl);
    if (base.scheme != 'https' ||
        base.host.isEmpty ||
        base.userInfo.isNotEmpty ||
        base.hasQuery ||
        base.hasFragment) {
      throw const ApiFailure(
        'INVALID_CONFIGURATION',
        'Configure a secure API address.',
      );
    }
  }
  final String baseUrl;
  final ApiCredentials credentials;
  final JsonTransport transport;

  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, Object?>? body,
    String? key,
  }) async {
    if (!path.startsWith('/v1/') || path.startsWith('//')) {
      throw const ApiFailure('INVALID_PATH', 'Unsupported API path.');
    }
    try {
      final headers = await credentials.headers(idempotencyKey: key);
      final uri = Uri.parse('${baseUrl.replaceFirst(RegExp(r'/$'), '')}$path');
      final (status, response) = await transport(
        uri,
        method,
        headers,
        body == null ? null : jsonEncode(body),
      ).timeout(const Duration(seconds: 20));
      if (status == 401) {
        throw const ApiFailure(
          'UNAUTHENTICATED',
          'Your session has expired. Sign in again.',
          status: 401,
        );
      }
      final decoded = jsonDecode(response);
      if (decoded is! Map<String, dynamic>) {
        throw const ApiFailure(
          'INVALID_RESPONSE',
          'The service returned an invalid response.',
        );
      }
      if (status < 200 || status >= 300) {
        final error = decoded['error'];
        throw ApiFailure(
          error is Map
              ? error['code']?.toString() ?? 'REQUEST_FAILED'
              : 'REQUEST_FAILED',
          error is Map
              ? error['message']?.toString() ?? 'The request failed.'
              : 'The request failed.',
          retryable: error is Map && error['retryable'] == true,
          status: status,
        );
      }
      return decoded;
    } on ApiFailure {
      rethrow;
    } on AuthFailure catch (failure) {
      throw ApiFailure(failure.code, failure.message);
    } on TimeoutException {
      throw const ApiFailure(
        'TIMEOUT',
        'The service took too long. Try again.',
        retryable: true,
      );
    } on FormatException {
      throw const ApiFailure(
        'INVALID_RESPONSE',
        'The service returned an invalid response.',
      );
    } catch (_) {
      throw const ApiFailure(
        'NETWORK_ERROR',
        'Could not reach the service. Check your connection and retry.',
        retryable: true,
      );
    }
  }
}
