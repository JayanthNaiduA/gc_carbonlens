import 'package:flutter/material.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/consent/consent_state.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/api/api_errors.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key, required this.controller, this.repository});
  final AuthController controller;
  final CarbonLensRepository? repository;
  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _camera = false;
  bool _location = false;
  bool _health = false;
  bool _personalization = false;
  bool _microphone = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final preferences = widget.controller.preferences;
    _camera = preferences.camera;
    _location = preferences.location;
    _health = preferences.healthConnect;
    _personalization = preferences.personalization;
    _microphone = preferences.microphone;
  }

  Future<void> _continue() async {
    final value = ConsentState(
      camera: _camera,
      location: _location,
      healthConnect: _health,
      personalization: _personalization,
      microphone: _microphone,
    ).acceptedNow();
    final repository = widget.repository;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      if (repository != null && !repository.isDemo) {
        await repository.mutate(
          '/v1/consents',
          value.toJson(),
          operationKey(),
          method: 'PUT',
        );
      }
      if (mounted) widget.controller.acceptConsent(value);
    } on ApiFailure catch (failure) {
      if (mounted) setState(() => _error = failure.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.controller;
    return PageShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const BrandMark(compact: true),
          const SizedBox(height: 28),
          Text(
            'Your data. Your choice.',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          const Text(
            'All preferences are optional. You can continue with every switch off.',
          ),
          const SizedBox(height: 20),
          MessageBox(
            message: widget.repository == null || widget.repository!.isDemo
                ? 'Demo preferences last for this session. Device permissions are requested separately when needed.'
                : 'Your preferences are saved securely before continuing. Device permissions are requested separately when needed.',
          ),
          _switch(
            'Camera',
            'Scan products and receipts',
            Icons.camera_alt_outlined,
            _camera,
            (v) => _camera = v,
          ),
          _switch(
            'Location',
            'Support commute and planting evidence',
            Icons.location_on_outlined,
            _location,
            (v) => _location = v,
          ),
          _switch(
            'Physical activity',
            'Read only the Health Connect data a feature needs',
            Icons.directions_walk,
            _health,
            (v) => _health = v,
          ),
          _switch(
            'Microphone',
            'Voice support is planned; no audio is captured in this build',
            Icons.mic_none,
            _microphone,
            (v) => _microphone = v,
          ),
          _switch(
            'Personalized suggestions',
            'Use your green history for recommendations',
            Icons.lightbulb_outline,
            _personalization,
            (v) => _personalization = v,
          ),
          const SizedBox(height: 20),
          if (_error != null) MessageBox(message: _error!, isError: true),
          if (auth.error != null)
            MessageBox(message: auth.error!, isError: true),
          FilledButton(
            key: const Key('consent-continue'),
            onPressed: auth.busy || _saving ? null : _continue,
            child: Text(
              _saving ? 'Saving preferences…' : 'Continue to my dashboard',
            ),
          ),
          TextButton(
            onPressed: auth.busy ? null : auth.signOut,
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }

  Widget _switch(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    void Function(bool) update,
  ) => SwitchListTile.adaptive(
    contentPadding: EdgeInsets.zero,
    secondary: Icon(icon),
    title: Text(title),
    subtitle: Text(subtitle),
    value: value,
    onChanged: widget.controller.busy || _saving
        ? null
        : (v) => setState(() => update(v)),
  );
}
