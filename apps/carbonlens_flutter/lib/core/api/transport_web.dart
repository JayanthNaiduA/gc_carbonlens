// Uses the SDK browser transport to avoid installing a networking dependency.
// ignore: deprecated_member_use
import 'dart:html';
import 'dart:async';
import 'dart:typed_data';

Future<(int, String)> sendJson(
  Uri uri,
  String method,
  Map<String, String> headers,
  String? body,
) async {
  final request = HttpRequest()..open(method, uri.toString());
  request.withCredentials = false;
  headers.forEach(request.setRequestHeader);
  final result = Completer<(int, String)>();
  final loaded = request.onLoad.listen((_) {
    if (!result.isCompleted)
      result.complete((request.status ?? 0, request.responseText ?? ''));
  });
  final failed = request.onError.listen((_) {
    if (!result.isCompleted)
      result.completeError(StateError('Network unavailable'));
  });
  request.send(body);
  try {
    return await result.future.timeout(const Duration(seconds: 18));
  } finally {
    await loaded.cancel();
    await failed.cancel();
    request.abort();
  }
}

Future<(int, String)> sendBytes(
  Uri uri,
  Map<String, String> headers,
  Uint8List body,
) async {
  final request = HttpRequest()..open('POST', uri.toString());
  headers.forEach(request.setRequestHeader);
  final result = Completer<(int, String)>();
  final loaded = request.onLoad.listen((_) {
    if (!result.isCompleted)
      result.complete((request.status ?? 0, request.responseText ?? ''));
  });
  final failed = request.onError.listen((_) {
    if (!result.isCompleted)
      result.completeError(StateError('Upload unavailable'));
  });
  request.send(Blob([body]));
  try {
    return await result.future.timeout(const Duration(seconds: 30));
  } finally {
    await loaded.cancel();
    await failed.cancel();
    request.abort();
  }
}
