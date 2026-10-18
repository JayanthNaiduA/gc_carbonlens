import 'package:flutter/foundation.dart';
import '../api/carbonlens_repository.dart';
import '../api/api_errors.dart';
import '../auth/auth_controller.dart';
import 'user_profile.dart';

class ProfileController extends ChangeNotifier {
  ProfileController(this.auth, this.repository) {
    auth.addListener(_sessionChanged);
    _sessionChanged();
  }
  final AuthController auth;
  final CarbonLensRepository repository;
  UserProfile? profile;
  String? error, notice;
  bool loading = false, saving = false;
  String? _uid;
  int _generation = 0;
  bool _disposed = false;
  String? _saveKey, _saveSignature;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void _sessionChanged() {
    if (_uid == auth.user?.uid) return;
    _uid = auth.user?.uid;
    _generation++;
    profile = null;
    error = null;
    notice = null;
    saving = false;
    _saveKey = null;
    _saveSignature = null;
    if (_uid != null && !auth.isDemo) {
      load();
    } else {
      loading = false;
      _notify();
    }
  }

  Future<void> load() async {
    if (_uid == null || _disposed) return;
    final generation = ++_generation;
    final uid = _uid;
    loading = true;
    error = null;
    _notify();
    try {
      final value = UserProfile.fromJson(await repository.get('/v1/me'));
      if (value.uid != uid)
        throw const ApiFailure(
          'PROFILE_OWNER_MISMATCH',
          'Your profile could not be verified.',
        );
      if (!_disposed && generation == _generation) profile = value;
    } on ApiFailure catch (failure) {
      if (!_disposed && generation == _generation) {
        error = failure.message;
        if (failure.status == 401) await auth.signOut();
      }
    } catch (_) {
      if (!_disposed && generation == _generation)
        error = 'Your profile could not be loaded. Retry when connected.';
    } finally {
      if (!_disposed && generation == _generation) {
        loading = false;
        _notify();
      }
    }
  }

  Future<bool> save(String name, String region) async {
    if (saving || loading || profile == null || _disposed) return false;
    final generation = _generation;
    final signature = '${profile!.version}:${name.trim()}:$region';
    if (signature != _saveSignature) {
      _saveKey = operationKey();
      _saveSignature = signature;
    }
    saving = true;
    error = null;
    notice = null;
    _notify();
    try {
      final result = UserProfile.fromJson(
        await repository.mutate(
          '/v1/me',
          {
            'display_name': name.trim(),
            'region': region,
            'expected_version': profile!.version,
          },
          _saveKey!,
          method: 'PUT',
        ),
      );
      if (_disposed || generation != _generation) return false;
      if (result.uid != _uid)
        throw const ApiFailure(
          'PROFILE_OWNER_MISMATCH',
          'Your profile could not be verified.',
        );
      profile = result;
      notice = 'Profile saved.';
      _saveKey = null;
      _saveSignature = null;
      // App profile is authoritative. Update Firebase's cosmetic display name
      // only after persistence, without treating a mirror failure as save failure.
      try {
        await auth.updateDisplayName(result.name);
      } catch (_) {}
      return true;
    } on ApiFailure catch (failure) {
      if (!_disposed && generation == _generation) {
        error = failure.message;
        if (failure.status == 401) await auth.signOut();
      }
      return false;
    } catch (_) {
      if (!_disposed && generation == _generation)
        error = 'Profile could not be saved. Retry when connected.';
      return false;
    } finally {
      if (!_disposed && generation == _generation) {
        saving = false;
        _notify();
      }
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    auth.removeListener(_sessionChanged);
    super.dispose();
  }
}
