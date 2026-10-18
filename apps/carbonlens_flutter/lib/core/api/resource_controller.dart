import 'package:flutter/foundation.dart';
import 'api_errors.dart';
import 'carbonlens_repository.dart';

class ResourceController extends ChangeNotifier {
  ResourceController(this.repository);
  final CarbonLensRepository repository;
  Map<String, dynamic>? data;
  ApiFailure? error;
  bool loading = false;
  bool _disposed = false;
  int _generation = 0;

  Future<void> load(String path) async {
    final generation = ++_generation;
    loading = true;
    error = null;
    data = null;
    notifyListeners();
    try {
      final result = await repository.get(path);
      if (!_disposed && generation == _generation) data = result;
    } on ApiFailure catch (failure) {
      if (!_disposed && generation == _generation) error = failure;
    } catch (_) {
      if (!_disposed && generation == _generation)
        error = const ApiFailure(
          'INVALID_RESPONSE',
          'The service returned unsupported data.',
        );
    } finally {
      if (!_disposed && generation == _generation) {
        loading = false;
        notifyListeners();
      }
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}
