import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'auth_service.dart';
import 'auth_state.dart';
import 'phone_auth.dart';

class FirebaseAuthService implements AuthService, AccountAuthService {
  FirebaseAuthService(
    this._auth, {
    this.googleServerClientId = '',
    this.useEmulator = false,
  });
  final FirebaseAuth _auth;
  final String googleServerClientId;
  final bool useEmulator;
  Future<void>? _googleInitialization;
  bool _newUser = false;
  int _phoneGeneration = 0;
  bool _phoneApplying = false;
  final _phoneOwners = <String, String?>{};

  AuthUser? _map(User? user) => user == null
      ? null
      : AuthUser(
          uid: user.uid,
          displayName: user.displayName?.trim().isNotEmpty == true
              ? user.displayName!
              : 'Green explorer',
          email: user.email,
          emailVerified: user.emailVerified,
          isDemo: false,
          phoneNumber: user.phoneNumber,
          photoUrl: user.photoURL,
          providers: user.providerData.map((p) => p.providerId).toList(),
          isNewUser: _newUser,
        );

  @override
  AuthUser? get currentUser => _map(_auth.currentUser);
  @override
  bool get isDemo => false;
  @override
  bool get usesAuthEmulator => useEmulator;
  @override
  bool get supportsGoogleSignIn => !useEmulator;
  @override
  Stream<AuthUser?> get authStateChanges => _auth.userChanges().map(_map);

  Future<void> _perform(Future<void> Function() operation) async {
    try {
      await operation();
    } on FirebaseAuthException catch (error) {
      throw _safeFailure(error.code);
    } on GoogleSignInException catch (error) {
      if (error.code == GoogleSignInExceptionCode.canceled) {
        throw const AuthFailure('cancelled', 'Sign-in was cancelled.');
      }
      throw const AuthFailure(
        'google-sign-in-failed',
        'Google sign-in could not finish. Check the Android app and OAuth configuration.',
      );
    } on AuthFailure {
      rethrow;
    } catch (_) {
      throw const AuthFailure(
        'auth-unavailable',
        'Sign-in is temporarily unavailable. Please try again.',
      );
    }
  }

  @override
  Future<void> signInWithEmail(String email, String password) =>
      _perform(() async {
        final result = await _auth.signInWithEmailAndPassword(
          email: email.trim(),
          password: password,
        );
        _newUser = result.additionalUserInfo?.isNewUser ?? false;
      });

  @override
  Future<void> createEmailAccount(String email, String password) =>
      _perform(() async {
        final result = await _auth.createUserWithEmailAndPassword(
          email: email.trim(),
          password: password,
        );
        _newUser = result.additionalUserInfo?.isNewUser ?? true;
      });

  @override
  Future<void> signInWithGoogle() => _perform(() async {
    if (useEmulator) {
      throw const AuthFailure(
        'google-disabled',
        'Use email sign-in for the local Firebase Auth emulator.',
      );
    }
    if (kIsWeb) {
      final result = await _auth.signInWithPopup(GoogleAuthProvider());
      _newUser = result.additionalUserInfo?.isNewUser ?? false;
      return;
    }
    if (googleServerClientId.isEmpty) {
      throw const AuthFailure(
        'google-config-missing',
        'Configure the Android web OAuth client ID before Google sign-in.',
      );
    }
    _googleInitialization ??= GoogleSignIn.instance.initialize(
      serverClientId: googleServerClientId,
    );
    await _googleInitialization;
    final account = await GoogleSignIn.instance.authenticate();
    final token = account.authentication.idToken;
    if (token == null || token.isEmpty) {
      throw const AuthFailure(
        'google-token-missing',
        'Google sign-in did not return a valid credential.',
      );
    }
    final result = await _auth.signInWithCredential(
      GoogleAuthProvider.credential(idToken: token),
    );
    _newUser = result.additionalUserInfo?.isNewUser ?? false;
  });

  Future<AuthCredential> _googleCredential() async {
    if (googleServerClientId.isEmpty)
      throw const AuthFailure(
        'google-config-missing',
        'Configure the Web OAuth client ID for Android Google sign-in.',
      );
    _googleInitialization ??= GoogleSignIn.instance.initialize(
      serverClientId: googleServerClientId,
    );
    await _googleInitialization;
    final account = await GoogleSignIn.instance.authenticate();
    final token = account.authentication.idToken;
    if (token == null)
      throw const AuthFailure(
        'google-token-missing',
        'Google did not return a credential.',
      );
    return GoogleAuthProvider.credential(idToken: token);
  }

  User _current() {
    final user = _auth.currentUser;
    if (user == null) throw const AuthFailure('signed-out', 'Sign in again.');
    return user;
  }

  @override
  Future<void> linkGoogle() => _perform(() async {
    final user = _current();
    if (kIsWeb) {
      await user.linkWithPopup(GoogleAuthProvider());
    } else {
      await user.linkWithCredential(await _googleCredential());
    }
    await user.reload();
  });
  @override
  Future<void> reauthenticateGoogle() => _perform(() async {
    final user = _current();
    if (kIsWeb) {
      await user.reauthenticateWithPopup(GoogleAuthProvider());
    } else {
      await user.reauthenticateWithCredential(await _googleCredential());
    }
  });
  @override
  Future<void> reauthenticatePassword(String password) => _perform(() async {
    final user = _current();
    if (user.email == null)
      throw const AuthFailure(
        'provider-unavailable',
        'Use a linked sign-in method to confirm your identity.',
      );
    await user.reauthenticateWithCredential(
      EmailAuthProvider.credential(email: user.email!, password: password),
    );
  });
  @override
  Future<void> updateDisplayName(String value) => _perform(() async {
    await _current().updateDisplayName(value);
  });
  @override
  Future<void> changeEmail(String value) => _perform(() async {
    await _current().verifyBeforeUpdateEmail(value.trim());
  });

  @override
  void cancelPhone() {
    _phoneGeneration++;
    _phoneOwners.clear();
  }

  Future<void> _phoneCredential(
    PhoneAuthCredential credential,
    PhonePurpose purpose,
    String? owner,
  ) async {
    if (_phoneApplying)
      throw const AuthFailure(
        'verification-in-progress',
        'Verification is already completing.',
      );
    if (_auth.currentUser?.uid != owner)
      throw const AuthFailure(
        'session-changed',
        'Your account changed. Start verification again.',
      );
    _phoneApplying = true;
    try {
      if (purpose == PhonePurpose.signIn) {
        final result = await _auth.signInWithCredential(credential);
        _newUser = result.additionalUserInfo?.isNewUser ?? false;
      } else {
        final user = _current();
        if (user.uid != owner)
          throw const AuthFailure(
            'session-changed',
            'Your account changed. Start verification again.',
          );
        switch (purpose) {
          case PhonePurpose.link:
            await user.linkWithCredential(credential);
          case PhonePurpose.update:
            await user.updatePhoneNumber(credential);
          case PhonePurpose.reauthenticate:
            await user.reauthenticateWithCredential(credential);
          case PhonePurpose.signIn:
            break;
        }
        await user.reload();
      }
    } finally {
      _phoneApplying = false;
    }
  }

  @override
  Future<void> requestPhone(
    String number,
    PhonePurpose purpose, {
    int? resendToken,
    required void Function(PhoneChallenge) codeSent,
    required void Function(AuthFailure) failed,
    required void Function() automatic,
    required void Function() timeout,
  }) => _perform(() async {
    if (kIsWeb)
      throw const AuthFailure(
        'phone-platform',
        'This phone verification flow is for Android. Use Google or email on web.',
      );
    final generation = ++_phoneGeneration;
    final owner = _auth.currentUser?.uid;
    await _auth.verifyPhoneNumber(
      phoneNumber: number,
      forceResendingToken: resendToken,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (credential) async {
        if (generation != _phoneGeneration || _phoneApplying) return;
        try {
          await _perform(() => _phoneCredential(credential, purpose, owner));
          if (generation == _phoneGeneration) {
            automatic();
            cancelPhone();
          }
        } on AuthFailure catch (error) {
          if (generation == _phoneGeneration) failed(error);
        }
      },
      verificationFailed: (error) {
        if (generation == _phoneGeneration) failed(_safeFailure(error.code));
      },
      codeSent: (id, token) {
        if (generation == _phoneGeneration) {
          _phoneOwners[id] = owner;
          codeSent(PhoneChallenge(id, token));
        }
      },
      codeAutoRetrievalTimeout: (_) {
        if (generation == _phoneGeneration) timeout();
      },
    );
  });
  @override
  Future<void> confirmPhone(
    PhoneChallenge challenge,
    String code,
    PhonePurpose purpose,
  ) => _perform(() async {
    if (!_phoneOwners.containsKey(challenge.verificationId))
      throw const AuthFailure(
        'session-expired',
        'Start phone verification again.',
      );
    final owner = _phoneOwners[challenge.verificationId];
    await _phoneCredential(
      PhoneAuthProvider.credential(
        verificationId: challenge.verificationId,
        smsCode: code,
      ),
      purpose,
      owner,
    );
    cancelPhone();
  });

  @override
  Future<void> continueAsDemo() async => throw const AuthFailure(
    'demo-disabled',
    'Local demo sign-in is unavailable in Firebase mode.',
  );

  @override
  Future<void> sendPasswordReset(String email) => _perform(() async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (error) {
      // Keep account existence private even on projects without enumeration protection.
      if (!['user-not-found', 'invalid-credential'].contains(error.code))
        rethrow;
    }
  });

  @override
  Future<void> sendEmailVerification() => _perform(() async {
    final user = _auth.currentUser;
    if (user == null) throw const AuthFailure('signed-out', 'Sign in first.');
    if (!user.emailVerified) await user.sendEmailVerification();
  });

  @override
  Future<void> reloadUser() => _perform(() async {
    await _auth.currentUser?.reload();
  });

  @override
  Future<String?> idToken({bool forceRefresh = false}) async {
    try {
      return await _auth.currentUser?.getIdToken(forceRefresh);
    } catch (_) {
      throw const AuthFailure(
        'token-refresh-failed',
        'Your session could not refresh. Please sign in again.',
      );
    }
  }

  @override
  Future<void> signOut() => _perform(() async {
    cancelPhone();
    _newUser = false;
    await _auth.signOut();
    // Firebase session is already gone even if native provider cleanup fails.
    if (!kIsWeb && _googleInitialization != null) {
      try {
        await GoogleSignIn.instance.signOut();
      } catch (_) {}
    }
  });

  @override
  Future<void> dispose() async {
    cancelPhone();
  }

  AuthFailure _safeFailure(String code) {
    final message = switch (code) {
      'invalid-email' => 'Enter a valid email address.',
      'weak-password' =>
        'Use a stronger password that meets the Firebase password policy.',
      'invalid-credential' ||
      'wrong-password' ||
      'user-not-found' ||
      'user-disabled' =>
        'Sign-in failed. Check your details or reset your password.',
      'email-already-in-use' =>
        'This account could not be created. Try sign-in or password reset.',
      'too-many-requests' => 'Too many attempts. Wait a moment and try again.',
      'invalid-phone-number' => 'Enter a valid international phone number.',
      'invalid-verification-code' =>
        'That code is incorrect. Check the SMS and try again.',
      'session-expired' ||
      'invalid-verification-id' => 'This code has expired. Request a new code.',
      'quota-exceeded' =>
        'SMS verification is temporarily unavailable. Try again later.',
      'app-not-authorized' ||
      'invalid-app-credential' ||
      'missing-app-credential' =>
        'Phone app verification failed. Check the Android app and SHA configuration.',
      'requires-recent-login' =>
        'Confirm your identity again from your profile, then retry this change.',
      'credential-already-in-use' ||
      'account-exists-with-different-credential' =>
        'This credential belongs to another account. Sign in to that account; accounts will not be merged automatically.',
      'provider-already-linked' => 'This sign-in provider is already linked.',
      'user-mismatch' =>
        'Confirm the identity of the currently signed-in account.',
      'network-request-failed' => 'Check your connection and try again.',
      'popup-closed-by-user' ||
      'cancelled-popup-request' => 'Sign-in was cancelled.',
      'operation-not-allowed' =>
        'Enable this sign-in provider in Firebase Authentication.',
      _ => 'Authentication could not finish. Please try again.',
    };
    return AuthFailure(code, message);
  }
}
