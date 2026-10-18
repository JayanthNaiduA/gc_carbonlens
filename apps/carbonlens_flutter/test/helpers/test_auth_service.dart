import 'dart:async';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'package:carbonlens_flutter/core/auth/auth_state.dart';

class TestAuthService implements AuthService {
  final _changes = StreamController<AuthUser?>.broadcast(sync: true);
  AuthUser? _user;
  AuthFailure? failure;
  Completer<void>? pending;
  int signInCount = 0;
  bool emulated = false;

  void setUser(String uid) {
    _user = AuthUser(
      uid: uid,
      displayName: 'John',
      email: null,
      emailVerified: true,
      isDemo: false,
    );
    _changes.add(_user);
  }

  @override
  AuthUser? get currentUser => _user;
  @override
  bool get isDemo => false;
  @override
  bool get usesAuthEmulator => emulated;
  @override
  bool get supportsGoogleSignIn => true;
  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;
  @override
  Future<void> signInWithEmail(String email, String password) async {
    signInCount++;
    if (failure != null) throw failure!;
    if (pending != null) await pending!.future;
    setUser('test-user');
  }

  @override
  Future<void> createEmailAccount(String email, String password) =>
      signInWithEmail(email, password);
  @override
  Future<void> signInWithGoogle() => signInWithEmail('', '');
  @override
  Future<void> continueAsDemo() async {}
  @override
  Future<void> sendPasswordReset(String email) async {}
  @override
  Future<void> sendEmailVerification() async {}
  @override
  Future<void> reloadUser() async {}
  @override
  Future<String?> idToken({bool forceRefresh = false}) async =>
      _user == null ? null : 'TEST_ONLY_ID_TOKEN';
  @override
  Future<void> signOut() async {
    _user = null;
    _changes.add(null);
  }

  @override
  Future<void> dispose() => _changes.close();
}
