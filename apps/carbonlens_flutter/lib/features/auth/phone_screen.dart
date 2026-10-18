import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/auth/phone_auth.dart';
import '../../core/auth/phone_controller.dart';

class PhoneScreen extends StatefulWidget {
  const PhoneScreen({
    super.key,
    required this.service,
    this.purpose = PhonePurpose.signIn,
    this.initialNumber,
  });
  final AccountAuthService service;
  final PhonePurpose purpose;
  final String? initialNumber;
  @override
  State<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends State<PhoneScreen> {
  late final controller = PhoneController(widget.service, widget.purpose);
  late final number = TextEditingController(text: widget.initialNumber);
  final code = TextEditingController();
  String country = '+91';
  bool agreed = false, returned = false;
  @override
  void initState() {
    super.initState();
    controller.addListener(_completed);
  }

  void _completed() {
    if (controller.completed && !returned) {
      returned = true;
      code.clear();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.pop(context, true);
      });
    }
  }

  @override
  void dispose() {
    controller.removeListener(_completed);
    controller.dispose();
    number.dispose();
    code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (context, _) {
      final otp = controller.challenge != null;
      final busy = controller.sending || controller.verifying;
      return PopScope(
        canPop: !busy && !otp,
        onPopInvokedWithResult: (popped, result) {
          if (!popped && !busy && otp) {
            code.clear();
            controller.backToNumber();
          }
        },
        child: PageShell(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandMark(compact: true),
              const SizedBox(height: 24),
              Text(
                otp
                    ? 'Verify your number'
                    : widget.purpose == PhonePurpose.signIn
                    ? 'Continue with Phone'
                    : widget.purpose == PhonePurpose.reauthenticate
                    ? 'Confirm your current phone'
                    : 'Verify a new phone number',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              Text(
                otp
                    ? 'Enter the code sent to ${controller.number}.'
                    : 'Choose your country code and enter your phone number.',
              ),
              const SizedBox(height: 20),
              if (!otp) ...[
                DropdownButtonFormField<String>(
                  initialValue: country,
                  decoration: const InputDecoration(
                    labelText: 'Country calling code',
                  ),
                  items: [
                    for (final option in [
                      ('+91', 'India +91'),
                      ('+1', 'US / Canada +1'),
                      ('+44', 'United Kingdom +44'),
                      ('+65', 'Singapore +65'),
                      ('+61', 'Australia +61'),
                    ])
                      DropdownMenuItem(
                        value: option.$1,
                        child: Text(option.$2),
                      ),
                  ],
                  onChanged: busy
                      ? null
                      : (value) => setState(() => country = value!),
                ),
                const SizedBox(height: 14),
                TextField(
                  key: const Key('phone-number'),
                  controller: number,
                  enabled: !busy,
                  keyboardType: TextInputType.phone,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    hintText: 'National number or full +country number',
                  ),
                ),
                CheckboxListTile(
                  value: agreed,
                  onChanged: busy
                      ? null
                      : (value) => setState(() => agreed = value!),
                  contentPadding: EdgeInsets.zero,
                  title: const Text('I agree to SMS verification'),
                  subtitle: const Text(
                    'Firebase/Google processes the number for authentication and abuse prevention. SMS charges may apply.',
                  ),
                ),
              ] else ...[
                TextField(
                  key: const Key('otp-code'),
                  controller: code,
                  enabled: !busy,
                  keyboardType: TextInputType.number,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  decoration: const InputDecoration(
                    labelText: 'Six-digit verification code',
                  ),
                  onSubmitted: (_) {
                    if (!busy) controller.verify(code.text);
                  },
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: busy || controller.cooldown > 0
                      ? null
                      : () {
                          code.clear();
                          controller.send(country, number.text, resend: true);
                        },
                  child: Text(
                    controller.cooldown > 0
                        ? 'Resend in ${controller.cooldown}s'
                        : 'Resend OTP',
                  ),
                ),
              ],
              if (controller.error != null)
                MessageBox(message: controller.error!, isError: true),
              if (controller.notice != null)
                MessageBox(message: controller.notice!),
              const SizedBox(height: 12),
              FilledButton(
                key: const Key('phone-submit'),
                onPressed:
                    busy || (!otp && (!agreed || controller.cooldown > 0))
                    ? null
                    : () => otp
                          ? controller.verify(code.text)
                          : controller.send(country, number.text),
                child: Text(
                  busy
                      ? 'Verifying…'
                      : otp
                      ? 'Verify OTP'
                      : controller.cooldown > 0
                      ? 'Try again in ${controller.cooldown}s'
                      : 'Send verification code',
                ),
              ),
              TextButton(
                onPressed: busy
                    ? null
                    : () {
                        if (otp) {
                          code.clear();
                          controller.backToNumber();
                        } else {
                          Navigator.pop(context, false);
                        }
                      },
                child: Text(otp ? 'Change number' : 'Back'),
              ),
            ],
          ),
        ),
      );
    },
  );
}
