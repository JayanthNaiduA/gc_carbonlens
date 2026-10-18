import 'dart:async';
import 'package:flutter/foundation.dart';
import 'auth_service.dart';
import 'phone_auth.dart';

class PhoneController extends ChangeNotifier {
  PhoneController(this.service, this.purpose);
  final AccountAuthService service;
  final PhonePurpose purpose;
  PhoneChallenge? challenge;
  String? error, notice;
  String number = '';
  bool sending = false, verifying = false, completed = false;
  int cooldown = 0;
  Timer? _timer;
  int _generation = 0;
  bool _disposed = false;
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void _cooldown() {
    cooldown = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_disposed) return;
      cooldown--;
      if (cooldown <= 0) _timer?.cancel();
      _notify();
    });
  }

  Future<void> send(String country, String input, {bool resend = false}) async {
    if (sending || verifying || cooldown > 0 || completed) return;
    try {
      number = resend ? number : normalizePhone(country, input);
    } on AuthFailure catch (failure) {
      error = failure.message;
      _notify();
      return;
    }
    final generation = ++_generation;
    final token = resend ? challenge?.resendToken : null;
    sending = true;
    error = null;
    notice = null;
    _cooldown();
    _notify();
    bool active() => !_disposed && generation == _generation;
    try {
      await service.requestPhone(
        number,
        purpose,
        resendToken: token,
        codeSent: (value) {
          if (active() && !completed) {
            challenge = value;
            sending = false;
            notice = 'Code sent. Enter the six digits from your SMS.';
            _notify();
          }
        },
        failed: (failure) {
          if (active() && !completed) {
            sending = false;
            verifying = false;
            error = failure.message;
            _notify();
          }
        },
        automatic: () {
          if (active()) {
            completed = true;
            sending = false;
            verifying = false;
            _timer?.cancel();
            _notify();
          }
        },
        timeout: () {
          if (active() && !completed) {
            sending = false;
            notice =
                'Automatic retrieval timed out. Enter the SMS code, or resend when available.';
            _notify();
          }
        },
      );
    } on AuthFailure catch (failure) {
      if (active()) {
        sending = false;
        error = failure.message;
        _notify();
      }
    } catch (_) {
      if (active()) {
        sending = false;
        error = 'Verification could not start. Check your connection.';
        _notify();
      }
    }
  }

  Future<void> verify(String code) async {
    if (sending || verifying || challenge == null || completed) return;
    if (!RegExp(r'^[0-9]{6}$').hasMatch(code.trim())) {
      error = 'Enter the six-digit verification code.';
      _notify();
      return;
    }
    final generation = _generation;
    verifying = true;
    error = null;
    _notify();
    try {
      await service.confirmPhone(challenge!, code.trim(), purpose);
      if (!_disposed && generation == _generation) {
        completed = true;
        _timer?.cancel();
      }
    } on AuthFailure catch (failure) {
      if (!_disposed && generation == _generation) error = failure.message;
    } catch (_) {
      if (!_disposed && generation == _generation)
        error = 'Verification failed. Retry when connected.';
    } finally {
      if (!_disposed && generation == _generation) {
        verifying = false;
        _notify();
      }
    }
  }

  void backToNumber() {
    if (verifying) return;
    _generation++;
    service.cancelPhone();
    challenge = null;
    sending = false;
    error = null;
    notice = null;
    _notify();
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    _timer?.cancel();
    service.cancelPhone();
    super.dispose();
  }
}
