enum AuthStatus { signedOut, signedIn, tokenRefreshing }

class AuthUser {
  const AuthUser({
    required this.uid,
    required this.displayName,
    required this.email,
    required this.emailVerified,
    required this.isDemo,
    this.phoneNumber,
    this.photoUrl,
    this.providers = const [],
    this.isNewUser = false,
  });
  final String uid;
  final String displayName;
  final String? email;
  final bool emailVerified;
  final bool isDemo;
  final String? phoneNumber, photoUrl;
  final List<String> providers;
  final bool isNewUser;
}
