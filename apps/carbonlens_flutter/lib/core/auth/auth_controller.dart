import 'dart:async';
import 'package:flutter/foundation.dart';
import '../consent/consent_state.dart';
import 'auth_service.dart';
import 'auth_state.dart';
import 'phone_auth.dart';

class AuthController extends ChangeNotifier {
  AuthController(this.service) : _user = service.currentUser {
    _subscription = service.authStateChanges.listen(
      _onUser,
      onError: (Object _) {
        error = 'Your session could not be updated. Please sign in again.';
        _notify();
      },
    );
  }

  final AuthService service;
  late final StreamSubscription<AuthUser?> _subscription;
  AuthUser? _user;
  ConsentState? _consent;
  ConsentState _preferences = const ConsentState();
  bool _disposed = false;
  bool busy = false;
  String? error;
  String? notice;
  AuthStatus _status = AuthStatus.signedOut;

  AuthUser? get user => _user;
  ConsentState? get consent => _consent;
  ConsentState get preferences => _preferences;
  bool get isDemo => service.isDemo;
  AuthStatus get status => _user == null
      ? AuthStatus.signedOut
      : _status == AuthStatus.tokenRefreshing
      ? AuthStatus.tokenRefreshing
      : AuthStatus.signedIn;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void _onUser(AuthUser? value) {
    if (value?.uid != _user?.uid) {
      _consent = null;
      _preferences = const ConsentState();
    }
    _user = value;
    _status = value == null ? AuthStatus.signedOut : AuthStatus.signedIn;
    _notify();
  }

  Future<bool> _run(
    Future<void> Function() operation, {
    String? success,
  }) async {
    if (busy || _disposed) return false;
    busy = true;
    error = null;
    notice = null;
    _notify();
    try {
      await operation();
      notice = success;
      return true;
    } on AuthFailure catch (failure) {
      if (failure.code != 'cancelled') error = failure.message;
      return false;
    } catch (_) {
      error = 'This action could not finish. Please try again.';
      return false;
    } finally {
      busy = false;
      _notify();
    }
  }

  Future<bool> signIn(String email, String password) =>
      _run(() => service.signInWithEmail(email, password));
  Future<bool> createAccount(String email, String password) =>
      _run(() => service.createEmailAccount(email, password));
  Future<bool> signInWithGoogle() => _run(service.signInWithGoogle);
  AccountAuthService? get accountService =>
      service is AccountAuthService ? service as AccountAuthService : null;
  Future<bool> linkGoogle() => _run(() => accountService!.linkGoogle());
  Future<void> updateDisplayName(String value) async {
    if (accountService != null) await accountService!.updateDisplayName(value);
  }

  Future<bool> changeEmail(String value) => _run(
    () => accountService!.changeEmail(value),
    success:
        'Verification sent to the new address. Your email changes only after Firebase verifies it.',
  );
  Future<bool> reauthenticateGoogle() => _run(
    () => accountService!.reauthenticateGoogle(),
    success: 'Identity confirmed.',
  );
  Future<bool> reauthenticatePassword(String password) => _run(
    () => accountService!.reauthenticatePassword(password),
    success: 'Identity confirmed.',
  );
  Future<bool> continueAsDemo() => _run(service.continueAsDemo);
  Future<bool> resetPassword(String email) => _run(
    () => service.sendPasswordReset(email),
    success:
        'If an account exists for that email, a password reset link has been sent.',
  );
  Future<bool> verifyEmail() => _run(
    service.sendEmailVerification,
    success: 'Verification email requested. Check your inbox.',
  );
  Future<bool> refreshUser() => _run(service.reloadUser);
  Future<bool> signOut() => _run(service.signOut);

  void acceptConsent(ConsentState value) {
    if (_user == null || busy) return;
    // Session-local until the protected consent API is implemented; never persist PII here.
    _consent = value.acceptedNow();
    _preferences = _consent!;
    _notify();
  }

  void editConsent() {
    _consent = null;
    _notify();
  }

  Future<String?> refreshToken() async {
    if (_user == null || busy) return null;
    _status = AuthStatus.tokenRefreshing;
    _notify();
    try {
      return await service.idToken(forceRefresh: true);
    } finally {
      _status = _user == null ? AuthStatus.signedOut : AuthStatus.signedIn;
      _notify();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    unawaited(_subscription.cancel());
    unawaited(service.dispose());
    super.dispose();
  }
}
