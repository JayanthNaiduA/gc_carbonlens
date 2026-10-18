import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/profile/profile_controller.dart';
import '../profile/profile_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key, required this.auth, this.profile});
  final AuthController auth;
  final ProfileController? profile;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      GreenCard(
        child: ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const CircleAvatar(
            backgroundColor: mint,
            child: Icon(Icons.person_outline, color: green),
          ),
          title: Text(profile?.profile?.name ?? auth.user!.displayName),
          subtitle: Text(
            auth.isDemo
                ? 'Local demo account'
                : auth.user!.email == null && auth.user!.phoneNumber != null
                ? 'Phone verified'
                : auth.user!.emailVerified
                ? 'Email verified'
                : 'Email verification pending',
          ),
        ),
      ),
      SectionTitle('Privacy & Data Consent'),
      if (profile != null)
        OutlinedButton.icon(
          onPressed: auth.busy
              ? null
              : () => Navigator.push<void>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => Scaffold(
                      appBar: AppBar(title: const Text('Profile')),
                      body: SafeArea(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: ProfileScreen(
                            controller: profile!,
                            auth: auth,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
          icon: const Icon(Icons.manage_accounts_outlined),
          label: const Text('View and edit profile'),
        ),
      GreenCard(
        child: Column(
          children: [
            MetricRow(
              Icons.camera_alt_outlined,
              'Camera',
              auth.preferences.camera ? 'Allowed' : 'Off',
            ),
            MetricRow(
              Icons.directions_walk,
              'Physical activity',
              auth.preferences.healthConnect ? 'Allowed' : 'Off',
            ),
            MetricRow(
              Icons.location_on_outlined,
              'Location',
              auth.preferences.location ? 'Allowed' : 'Off',
            ),
            MetricRow(
              Icons.mic_none,
              'Microphone',
              auth.preferences.microphone ? 'Allowed' : 'Off',
            ),
            MetricRow(
              Icons.lightbulb_outline,
              'Personalized suggestions',
              auth.preferences.personalization ? 'Allowed' : 'Off',
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      OutlinedButton.icon(
        onPressed: auth.busy ? null : auth.editConsent,
        icon: const Icon(Icons.privacy_tip_outlined),
        label: const Text('Review privacy preferences'),
      ),
      if (!auth.isDemo && !auth.user!.emailVerified) ...[
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: auth.busy ? null : auth.verifyEmail,
          child: const Text('Send verification email'),
        ),
        TextButton(
          onPressed: auth.busy ? null : auth.refreshUser,
          child: const Text('I have verified'),
        ),
      ],
      if (auth.error != null) MessageBox(message: auth.error!, isError: true),
      if (auth.notice != null) MessageBox(message: auth.notice!),
      const SizedBox(height: 20),
      FilledButton.icon(
        key: const Key('sign-out'),
        onPressed: auth.busy ? null : auth.signOut,
        icon: const Icon(Icons.logout),
        label: const Text('Sign out'),
      ),
      const SizedBox(height: 16),
      const Text(
        'Green Points are loyalty units. Device permissions are requested separately and can be changed in device settings.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}
