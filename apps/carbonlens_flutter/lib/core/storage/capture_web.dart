// ignore: deprecated_member_use
import 'dart:html';
import 'dart:async';
import 'dart:typed_data';
import '../api/api_errors.dart';

Future<(Uint8List, String)?> pickImage({bool camera = false}) async {
  final input = FileUploadInputElement()..accept = 'image/jpeg,image/png';
  if (camera) input.setAttribute('capture', 'environment');
  final result = Completer<(Uint8List, String)?>();
  final cancelled = input.on['cancel'].listen((_) {
    if (!result.isCompleted) result.complete(null);
  });
  final selected = input.onChange.listen((_) async {
    try {
      final files = input.files;
      if (files == null || files.isEmpty) {
        if (!result.isCompleted) result.complete(null);
        return;
      }
      final file = files.first;
      if (file.size <= 0 ||
          file.size > 10 * 1024 * 1024 ||
          !['image/jpeg', 'image/png'].contains(file.type)) {
        throw const ApiFailure(
          'INVALID_IMAGE',
          'Choose a JPEG or PNG smaller than 10 MiB.',
        );
      }
      final reader = FileReader()..readAsArrayBuffer(file);
      await reader.onLoad.first;
      if (!result.isCompleted)
        result.complete((reader.result as Uint8List, file.type));
    } catch (_) {
      if (!result.isCompleted)
        result.completeError(
          const ApiFailure(
            'INVALID_IMAGE',
            'The selected image could not be read.',
          ),
        );
    }
  });
  input.click();
  try {
    return await result.future.timeout(
      const Duration(minutes: 2),
      onTimeout: () => null,
    );
  } finally {
    await cancelled.cancel();
    await selected.cancel();
  }
}
