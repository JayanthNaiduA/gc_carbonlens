import 'package:flutter/material.dart';
import '../../app/widgets/page_shell.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/auth/phone_auth.dart';
import '../../core/profile/profile_controller.dart';
import '../auth/phone_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.controller,
    required this.auth,
    this.enrollment = false,
  });
  final ProfileController controller;
  final AuthController auth;
  final bool enrollment;
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController();
  String region = '';
  bool editing = false;
  int? version;
  @override
  void dispose() {
    name.dispose();
    super.dispose();
  }

  Future<void> phone(PhonePurpose purpose) async {
    final service = widget.auth.accountService;
    if (service == null) return;
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => PhoneScreen(
          service: service,
          purpose: purpose,
          initialNumber: purpose == PhonePurpose.reauthenticate
              ? widget.auth.user?.phoneNumber
              : null,
        ),
      ),
    );
    if (result == true && mounted) {
      await widget.auth.refreshUser();
      await widget.auth.refreshToken();
      await widget.controller.load();
    }
  }

  Future<void> emailOrPassword(bool password) async {
    final input = TextEditingController();
    final dialogForm = GlobalKey<FormState>();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(password ? 'Confirm your password' : 'Verify a new email'),
        content: Form(
          key: dialogForm,
          child: TextFormField(
            controller: input,
            obscureText: password,
            enableSuggestions: !password,
            autocorrect: false,
            keyboardType: password
                ? TextInputType.text
                : TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: password ? 'Password' : 'New email address',
            ),
            validator: (value) => password
                ? (value?.isNotEmpty == true ? null : 'Enter your password.')
                : (RegExp(
                        r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                      ).hasMatch(value?.trim() ?? '')
                      ? null
                      : 'Enter a valid email address.'),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (dialogForm.currentState!.validate())
                Navigator.pop(context, input.text);
            },
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    input.clear();
    // The dialog field finishes its exit animation before its controller is disposed.
    await Future<void>.delayed(const Duration(milliseconds: 250));
    input.dispose();
    if (result != null && mounted) {
      if (password) {
        await widget.auth.reauthenticatePassword(result);
      } else {
        await widget.auth.changeEmail(result);
      }
    }
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([widget.controller, widget.auth]),
    builder: (context, _) {
      if (widget.auth.user == null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) Navigator.popUntil(context, (route) => route.isFirst);
        });
        return const SizedBox.shrink();
      }
      final profile = widget.controller.profile;
      if (profile == null)
        return Column(
          children: [
            if (widget.controller.loading) const CircularProgressIndicator(),
            if (widget.controller.error != null)
              MessageBox(message: widget.controller.error!, isError: true),
            OutlinedButton(
              onPressed: widget.controller.loading
                  ? null
                  : widget.controller.load,
              child: const Text('Retry profile'),
            ),
          ],
        );
      if (version != profile.version) {
        name.text = profile.name;
        region = profile.region;
        version = profile.version;
      }
      final canEdit = widget.enrollment || editing;
      final busy =
          widget.controller.saving ||
          widget.controller.loading ||
          widget.auth.busy;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.enrollment ? 'Complete your profile' : 'Your profile',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          if (widget.enrollment)
            const Text(
              'Your identity is verified. Save your name and region to finish enrollment.',
            ),
          const SizedBox(height: 18),
          GreenCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: mint,
                  child:
                      profile.photoUrl != null &&
                          Uri.tryParse(profile.photoUrl!)?.scheme == 'https'
                      ? ClipOval(
                          child: Image.network(
                            profile.photoUrl!,
                            width: 64,
                            height: 64,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                const Icon(Icons.person_outline),
                          ),
                        )
                      : const Icon(
                          Icons.person_outline,
                          size: 36,
                          color: green,
                        ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.name.isEmpty ? 'Green explorer' : profile.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(profile.providers.join(', ')),
                      if (profile.email != null) Text(profile.email!),
                      if (profile.phone != null) Text(profile.phone!),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Form(
            key: form,
            child: Column(
              children: [
                TextFormField(
                  key: const Key('profile-name'),
                  controller: name,
                  enabled: canEdit && !busy,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(labelText: 'Display name'),
                  validator: (v) =>
                      v == null ||
                          v.trim().length < 2 ||
                          v.trim().length > 80 ||
                          v.contains(RegExp(r'[\x00-\x1f]'))
                      ? 'Use 2 to 80 characters.'
                      : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  key: ValueKey('region-${profile.version}-$editing'),
                  initialValue: region,
                  enabled: canEdit && !busy,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    labelText: 'Country / region code',
                    hintText: 'IN, SG, AU…',
                  ),
                  onChanged: (v) => region = v.trim().toUpperCase(),
                  validator: (_) => !RegExp(r'^[A-Z]{2}$').hasMatch(region)
                      ? 'Use a two-letter country/region code.'
                      : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (widget.controller.error != null)
            MessageBox(message: widget.controller.error!, isError: true),
          if (widget.controller.notice != null)
            MessageBox(message: widget.controller.notice!),
          if (canEdit)
            FilledButton(
              key: const Key('save-profile'),
              onPressed: busy
                  ? null
                  : () async {
                      if (!form.currentState!.validate()) return;
                      if (await widget.controller.save(name.text, region) &&
                          mounted)
                        setState(() => editing = false);
                    },
              child: Text(
                busy
                    ? 'Saving…'
                    : widget.enrollment
                    ? 'Finish enrollment'
                    : 'Save profile',
              ),
            )
          else
            OutlinedButton(
              onPressed: busy ? null : () => setState(() => editing = true),
              child: const Text('Edit profile'),
            ),
          if (editing && !widget.enrollment)
            TextButton(
              onPressed: busy
                  ? null
                  : () => setState(() {
                      editing = false;
                      name.text = profile.name;
                      region = profile.region;
                    }),
              child: const Text('Cancel'),
            ),
          if (!widget.enrollment && widget.auth.accountService != null) ...[
            SectionTitle('Verified contact details'),
            OutlinedButton(
              onPressed: busy
                  ? null
                  : () => phone(
                      profile.phone == null
                          ? PhonePurpose.link
                          : PhonePurpose.update,
                    ),
              child: Text(
                profile.phone == null
                    ? 'Link a phone number'
                    : 'Change verified phone',
              ),
            ),
            OutlinedButton(
              onPressed: busy ? null : () => emailOrPassword(false),
              child: const Text('Verify a new email'),
            ),
            if (!profile.providers.contains('google.com'))
              OutlinedButton(
                onPressed: busy
                    ? null
                    : () async {
                        if (await widget.auth.linkGoogle())
                          await widget.controller.load();
                      },
                child: const Text('Link Google account'),
              ),
            SectionTitle('Confirm identity before sensitive changes'),
            if (profile.providers.contains('google.com'))
              TextButton(
                onPressed: busy ? null : widget.auth.reauthenticateGoogle,
                child: const Text('Confirm with Google'),
              ),
            if (profile.providers.contains('password'))
              TextButton(
                onPressed: busy ? null : () => emailOrPassword(true),
                child: const Text('Confirm with password'),
              ),
            if (profile.phone != null)
              TextButton(
                onPressed: busy
                    ? null
                    : () => phone(PhonePurpose.reauthenticate),
                child: const Text('Confirm current phone with OTP'),
              ),
            TextButton(
              onPressed: busy
                  ? null
                  : () async {
                      await widget.auth.refreshUser();
                      await widget.controller.load();
                    },
              child: const Text('Refresh verified details'),
            ),
          ],
          if (widget.auth.error != null)
            MessageBox(message: widget.auth.error!, isError: true),
          if (widget.auth.notice != null)
            MessageBox(message: widget.auth.notice!),
          const SizedBox(height: 18),
          TextButton(
            onPressed: busy ? null : widget.auth.signOut,
            child: const Text('Sign out'),
          ),
        ],
      );
    },
  );
}
