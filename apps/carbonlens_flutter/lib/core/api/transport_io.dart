import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

Future<(int, String)> sendJson(
  Uri uri,
  String method,
  Map<String, String> headers,
  String? body,
) async {
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 15);
  try {
    final request = await client.openUrl(method, uri);
    // Never forward credentials to redirects or a different host.
    request.followRedirects = false;
    headers.forEach(request.headers.set);
    if (body != null) request.write(body);
    final response = await request.close().timeout(const Duration(seconds: 18));
    final text = await response
        .transform(utf8.decoder)
        .join()
        .timeout(const Duration(seconds: 18));
    return (response.statusCode, text);
  } finally {
    client.close(force: true);
  }
}

Future<(int, String)> sendBytes(
  Uri uri,
  Map<String, String> headers,
  Uint8List body,
) async {
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 15);
  try {
    final request = await client.postUrl(uri);
    request.followRedirects = false;
    headers.forEach(request.headers.set);
    request.add(body);
    final response = await request.close().timeout(const Duration(seconds: 30));
    return (
      response.statusCode,
      await response
          .transform(utf8.decoder)
          .join()
          .timeout(const Duration(seconds: 30)),
    );
  } finally {
    client.close(force: true);
  }
}
