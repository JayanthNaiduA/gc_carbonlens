import 'auth_state.dart';

class AuthFailure implements Exception {
  const AuthFailure(this.code, this.message);
  final String code;
  final String message;
}

abstract interface class AuthService {
  AuthUser? get currentUser;
  bool get isDemo;
  bool get usesAuthEmulator;
  bool get supportsGoogleSignIn;
  Stream<AuthUser?> get authStateChanges;
  Future<void> signInWithEmail(String email, String password);
  Future<void> createEmailAccount(String email, String password);
  Future<void> signInWithGoogle();
  Future<void> continueAsDemo();
  Future<void> sendPasswordReset(String email);
  Future<void> sendEmailVerification();
  Future<void> reloadUser();
  Future<String?> idToken({bool forceRefresh = false});
  Future<void> signOut();
  Future<void> dispose();
}
