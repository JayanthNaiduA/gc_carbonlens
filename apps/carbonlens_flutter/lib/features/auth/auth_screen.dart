import 'package:flutter/material.dart';
import '../../app/widgets/page_shell.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/auth/auth_controller.dart';
import 'phone_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.controller});
  final AuthController controller;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _creating = false;
  bool _showPassword = false;

  String? _emailError(String? value) =>
      value == null ||
          !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value.trim())
      ? 'Enter a valid email address.'
      : null;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = widget.controller;
    final success = _creating
        ? await auth.createAccount(_email.text, _password.text)
        : await auth.signIn(_email.text, _password.text);
    if (success) _password.clear();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.controller;
    return PageShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const BrandMark(),
          const SizedBox(height: 20),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: const Landscape(height: 165),
          ),
          const SizedBox(height: 30),
          Text(
            'Your greener day starts here',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          const Text(
            'Understand everyday choices and build better habits.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          if (auth.isDemo)
            const MessageBox(
              message:
                  'LOCAL DEMO · A sample account for testing. No Firebase connection, real credentials or rewards.',
            ),
          if (auth.service.usesAuthEmulator)
            const MessageBox(
              message:
                  'LOCAL AUTH EMULATOR · Use dummy test accounts only. No production authentication or backend access.',
            ),
          if (auth.error != null)
            MessageBox(message: auth.error!, isError: true),
          if (auth.notice != null) MessageBox(message: auth.notice!),
          if (auth.isDemo) ...[
            FilledButton(
              key: const Key('demo-sign-in'),
              onPressed: auth.busy ? null : auth.continueAsDemo,
              child: const Text('Explore demo as John'),
            ),
            const SizedBox(height: 14),
            const Text(
              'Real Google and email sign-in become available in Firebase mode.',
              textAlign: TextAlign.center,
            ),
          ] else ...[
            if (auth.accountService != null) ...[
              OutlinedButton.icon(
                key: const Key('phone-sign-in'),
                onPressed: auth.busy
                    ? null
                    : () => Navigator.push<bool>(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              PhoneScreen(service: auth.accountService!),
                        ),
                      ),
                icon: const Icon(Icons.phone_outlined),
                label: const Text('Continue with Phone'),
              ),
              const SizedBox(height: 12),
            ],
            if (auth.service.supportsGoogleSignIn) ...[
              OutlinedButton.icon(
                onPressed: auth.busy ? null : auth.signInWithGoogle,
                icon: const Icon(Icons.account_circle_outlined),
                label: const Text('Continue with Google'),
              ),
              const SizedBox(height: 18),
              const Text('or use your email', textAlign: TextAlign.center),
              const SizedBox(height: 18),
            ],
            Form(
              key: _form,
              child: Column(
                children: [
                  TextFormField(
                    key: const Key('email-field'),
                    controller: _email,
                    enabled: !auth.busy,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    validator: _emailError,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.alternate_email),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    key: const Key('password-field'),
                    controller: _password,
                    enabled: !auth.busy,
                    obscureText: !_showPassword,
                    enableSuggestions: false,
                    autocorrect: false,
                    autofillHints: [
                      _creating
                          ? AutofillHints.newPassword
                          : AutofillHints.password,
                    ],
                    onFieldSubmitted: (_) {
                      if (!auth.busy) _submit();
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty)
                        return 'Enter your password.';
                      if (_creating && value.length < 8)
                        return 'Use at least 8 characters.';
                      return null;
                    },
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        tooltip: _showPassword
                            ? 'Hide password'
                            : 'Show password',
                        onPressed: auth.busy
                            ? null
                            : () => setState(
                                () => _showPassword = !_showPassword,
                              ),
                        icon: Icon(
                          _showPassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    key: const Key('email-submit'),
                    onPressed: auth.busy ? null : _submit,
                    child: Text(_creating ? 'Create account' : 'Sign in'),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: auth.busy
                  ? null
                  : () {
                      _password.clear();
                      setState(() => _creating = !_creating);
                    },
              child: Text(
                _creating
                    ? 'Already have an account? Sign in'
                    : 'New to CarbonLens? Create an account',
              ),
            ),
            if (!_creating)
              TextButton(
                onPressed: auth.busy
                    ? null
                    : () {
                        if (_emailError(_email.text) != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Enter your email first.'),
                            ),
                          );
                        } else {
                          auth.resetPassword(_email.text);
                        }
                      },
                child: const Text('Forgot password?'),
              ),
          ],
          if (auth.busy)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
          const SizedBox(height: 24),
          const Text(
            'You choose which data to share. Feature permissions are requested when needed.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }
}
