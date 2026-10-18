import 'dart:async';
import 'package:carbonlens_flutter/core/api/carbonlens_repository.dart';
import 'package:carbonlens_flutter/core/api/api_errors.dart';

class TestProfileRepository implements CarbonLensRepository {
  TestProfileRepository({this.uid = 'test-user', this.complete = false});
  String uid;
  bool complete;
  bool hasConsent = false;
  int version = 0, saves = 0;
  String name = 'John', region = '';
  ApiFailure? loadFailure, saveFailure;
  Completer<Map<String, dynamic>>? pendingLoad, pendingSave;
  final keys = <String>[];
  Map<String, dynamic> get record => {
    'uid': uid,
    'display_name': name,
    'region': region,
    'profile_complete': complete,
    'version': version,
    'providers': ['google.com'],
    'email': 'john@example.com',
    'email_verified': true,
  };
  @override
  bool get isDemo => false;
  @override
  Future<Map<String, dynamic>> get(String path) async {
    if (path == '/v1/me') {
      if (loadFailure != null) throw loadFailure!;
      if (pendingLoad != null) return pendingLoad!.future;
      return record;
    }
    if (path == '/v1/consents')
      return hasConsent ? {'policy_version': 'prototype-consent-v1'} : {};
    // Existing dashboard resources are independent of profile enrollment.
    return <String, dynamic>{};
  }

  @override
  Future<Map<String, dynamic>> mutate(
    String path,
    Map<String, Object?> body,
    String key, {
    String method = 'POST',
  }) async {
    if (path == '/v1/me') {
      saves++;
      keys.add(key);
      if (saveFailure != null) throw saveFailure!;
      if (pendingSave != null) return pendingSave!.future;
      name = body['display_name'] as String;
      region = body['region'] as String;
      version++;
      complete = true;
      return record;
    }
    return body;
  }
}
