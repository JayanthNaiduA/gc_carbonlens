import 'auth_service.dart';

enum PhonePurpose { signIn, link, update, reauthenticate }

class PhoneChallenge {
  const PhoneChallenge(this.verificationId, this.resendToken);
  final String verificationId;
  final int? resendToken;
}

abstract interface class AccountAuthService {
  Future<void> requestPhone(
    String number,
    PhonePurpose purpose, {
    int? resendToken,
    required void Function(PhoneChallenge) codeSent,
    required void Function(AuthFailure) failed,
    required void Function() automatic,
    required void Function() timeout,
  });
  Future<void> confirmPhone(
    PhoneChallenge challenge,
    String code,
    PhonePurpose purpose,
  );
  void cancelPhone();
  Future<void> linkGoogle();
  Future<void> updateDisplayName(String value);
  Future<void> changeEmail(String value);
  Future<void> reauthenticateGoogle();
  Future<void> reauthenticatePassword(String password);
}

String normalizePhone(String countryCode, String input) {
  final compact = input.trim().replaceAll(RegExp(r'[\s()-]'), '');
  final prefix = countryCode.replaceAll('+', '');
  // National trunk prefixes vary; require explicit international format rather
  // than guessing if an entered national number begins with a trunk zero.
  final value = compact.startsWith('+') ? compact : '+$prefix$compact';
  if (!RegExp(r'^\+[1-9][0-9]{7,14}$').hasMatch(value) ||
      (!compact.startsWith('+') && compact.startsWith('0'))) {
    throw const AuthFailure(
      'invalid-phone-number',
      'Enter an international number, or a national number without a leading trunk zero.',
    );
  }
  if (countryCode == '+91' &&
      !compact.startsWith('+') &&
      !RegExp(r'^[6-9][0-9]{9}$').hasMatch(compact)) {
    throw const AuthFailure(
      'invalid-phone-number',
      'Enter a 10-digit Indian mobile number.',
    );
  }
  return value;
}
