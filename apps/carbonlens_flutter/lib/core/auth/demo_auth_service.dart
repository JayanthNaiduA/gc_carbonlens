import 'dart:async';
import 'auth_service.dart';
import 'auth_state.dart';

/// Local UI simulation only. Never issues credentials or calls Firebase.
class DemoAuthService implements AuthService {
  final _changes = StreamController<AuthUser?>.broadcast();
  AuthUser? _user;

  @override
  AuthUser? get currentUser => _user;
  @override
  bool get isDemo => true;
  @override
  bool get usesAuthEmulator => false;
  @override
  bool get supportsGoogleSignIn => false;
  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;

  @override
  Future<void> continueAsDemo() async {
    _user = const AuthUser(
      uid: 'demo-john',
      displayName: 'John',
      email: null,
      emailVerified: false,
      isDemo: true,
    );
    _changes.add(_user);
  }

  Never _unavailable() => throw const AuthFailure(
    'demo-only',
    'Demo mode uses a local sample account. Configure Firebase to use real sign-in.',
  );
  @override
  Future<void> signInWithEmail(String email, String password) async =>
      _unavailable();
  @override
  Future<void> createEmailAccount(String email, String password) async =>
      _unavailable();
  @override
  Future<void> signInWithGoogle() async => _unavailable();
  @override
  Future<void> sendPasswordReset(String email) async => _unavailable();
  @override
  Future<void> sendEmailVerification() async => _unavailable();
  @override
  Future<void> reloadUser() async {}
  @override
  Future<String?> idToken({bool forceRefresh = false}) async => null;
  @override
  Future<void> signOut() async {
    _user = null;
    _changes.add(null);
  }

  @override
  Future<void> dispose() => _changes.close();
}
