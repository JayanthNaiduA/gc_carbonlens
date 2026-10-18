import 'dart:math';
import 'api_client.dart';
import 'api_errors.dart';

abstract class CarbonLensRepository {
  bool get isDemo;
  Future<Map<String, dynamic>> get(String path);
  Future<Map<String, dynamic>> mutate(
    String path,
    Map<String, Object?> body,
    String key, {
    String method = 'POST',
  });
}

class RemoteCarbonLensRepository implements CarbonLensRepository {
  RemoteCarbonLensRepository(this.client);
  final ApiClient client;
  @override
  bool get isDemo => false;
  @override
  Future<Map<String, dynamic>> get(String path) => client.request('GET', path);
  @override
  Future<Map<String, dynamic>> mutate(
    String path,
    Map<String, Object?> body,
    String key, {
    String method = 'POST',
  }) => client.request(method, path, body: body, key: key);
}

class UnconfiguredRepository implements CarbonLensRepository {
  @override
  bool get isDemo => false;
  @override
  Future<Map<String, dynamic>> get(String path) async => throw const ApiFailure(
    'NOT_CONFIGURED',
    'The profile service is not connected. Configure the backend URL before completing enrollment.',
  );
  @override
  Future<Map<String, dynamic>> mutate(
    String path,
    Map<String, Object?> body,
    String key, {
    String method = 'POST',
  }) => get(path);
}

String operationKey() {
  final random = Random.secure();
  return List.generate(
    24,
    (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
  ).join();
}
