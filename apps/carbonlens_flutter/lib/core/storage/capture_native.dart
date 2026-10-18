import 'package:flutter/services.dart';
import '../api/api_errors.dart';

Future<(Uint8List, String)?> pickImage({bool camera = false}) async {
  try {
    final result = await const MethodChannel(
      'carbonlens/evidence',
    ).invokeMapMethod<String, dynamic>('pickImage', {'camera': camera});
    if (result == null) return null;
    return (result['bytes'] as Uint8List, result['content_type'] as String);
  } on PlatformException catch (failure) {
    throw ApiFailure(
      'CAPTURE_FAILED',
      failure.message ?? 'Photo selection could not finish.',
    );
  } on MissingPluginException {
    throw const ApiFailure(
      'CAPTURE_UNAVAILABLE',
      'Photo capture is supported on Android and web.',
    );
  }
}
