import 'package:flutter/material.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/profile/profile_controller.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/consent/consent_state.dart';
import '../consent/consent_screen.dart';
import '../dashboard/dashboard_screen.dart';
import 'profile_screen.dart';

class SessionGate extends StatefulWidget {
  const SessionGate({
    super.key,
    required this.auth,
    required this.repository,
    required this.storageBucket,
  });
  final AuthController auth;
  final CarbonLensRepository repository;
  final String storageBucket;
  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  late final profile = ProfileController(widget.auth, widget.repository);
  ConsentState? restored;
  bool consentLoaded = false;
  String? consentError;
  @override
  void initState() {
    super.initState();
    loadConsent();
  }

  Future<void> loadConsent() async {
    setState(() {
      consentLoaded = false;
      consentError = null;
    });
    try {
      final record = await widget.repository.get('/v1/consents');
      if (!mounted) return;
      if (record['policy_version'] == 'prototype-consent-v1')
        restored = ConsentState.fromJson(record);
      setState(() => consentLoaded = true);
    } catch (_) {
      if (mounted)
        setState(
          () => consentError =
              'Privacy preferences could not be loaded. Retry when connected.',
        );
    }
  }

  @override
  void dispose() {
    profile.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: profile,
    builder: (context, _) {
      if (profile.loading || profile.profile == null)
        return PageShell(
          child: Column(
            children: [
              const BrandMark(compact: true),
              const SizedBox(height: 24),
              if (profile.loading) const CircularProgressIndicator(),
              if (profile.error != null)
                MessageBox(message: profile.error!, isError: true),
              OutlinedButton(
                onPressed: profile.loading ? null : profile.load,
                child: const Text('Retry profile'),
              ),
              TextButton(
                onPressed: widget.auth.busy ? null : widget.auth.signOut,
                child: const Text('Sign out'),
              ),
            ],
          ),
        );
      if (!profile.profile!.complete)
        return PageShell(
          child: ProfileScreen(
            controller: profile,
            auth: widget.auth,
            enrollment: true,
          ),
        );
      if (!consentLoaded)
        return PageShell(
          child: Column(
            children: [
              if (consentError == null) const CircularProgressIndicator(),
              if (consentError != null)
                MessageBox(message: consentError!, isError: true),
              OutlinedButton(
                onPressed: loadConsent,
                child: const Text('Retry preferences'),
              ),
              TextButton(
                onPressed: widget.auth.signOut,
                child: const Text('Sign out'),
              ),
            ],
          ),
        );
      if (widget.auth.consent == null &&
          restored != null &&
          !widget.auth.busy) {
        final value = restored!;
        restored = null;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) widget.auth.acceptConsent(value);
        });
      }
      if (widget.auth.consent == null)
        return ConsentScreen(
          controller: widget.auth,
          repository: widget.repository,
        );
      return DashboardScreen(
        controller: widget.auth,
        repository: widget.repository,
        storageBucket: widget.storageBucket,
        profile: profile,
      );
    },
  );
}
