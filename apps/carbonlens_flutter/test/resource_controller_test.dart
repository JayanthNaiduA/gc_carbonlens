import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/core/api/carbonlens_repository.dart';
import 'package:carbonlens_flutter/core/api/resource_controller.dart';
import 'package:carbonlens_flutter/core/api/demo_repository.dart';
import 'package:carbonlens_flutter/core/api/api_errors.dart';

class PendingRepository implements CarbonLensRepository {
  final requests = <String, Completer<Map<String, dynamic>>>{};
  @override
  bool get isDemo => false;
  @override
  Future<Map<String, dynamic>> get(String path) =>
      (requests[path] = Completer()).future;
  @override
  Future<Map<String, dynamic>> mutate(
    String path,
    Map<String, Object?> body,
    String key, {
    String method = 'POST',
  }) => get(path);
}

void main() {
  test('stale period response cannot replace current snapshot', () async {
    final repository = PendingRepository();
    final controller = ResourceController(repository);
    final today = controller.load('today');
    final month = controller.load('month');
    repository.requests['month']!.complete({'period': 'month'});
    await month;
    repository.requests['today']!.complete({'period': 'today'});
    await today;
    expect(controller.data!['period'], 'month');
    controller.dispose();
  });
  test('dispose during a response prevents notification', () async {
    final repository = PendingRepository();
    final controller = ResourceController(repository);
    final request = controller.load('late');
    controller.dispose();
    repository.requests['late']!.complete({'result': true});
    await request;
  });
  test('demo mutations never claim successful uploads or rewards', () async {
    expect(
      () => DemoRepository().mutate('/v1/rewards/evaluate', {}, 'stable'),
      throwsA(isA<ApiFailure>()),
    );
  });
}
