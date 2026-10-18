import 'dart:async';
import 'package:flutter/material.dart';
import 'app/bootstrap.dart';
import 'app/routes.dart';
import 'app/theme.dart';
import 'app/widgets/page_shell.dart';
import 'core/config/app_config.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BootstrapShell());
}

class BootstrapShell extends StatefulWidget {
  const BootstrapShell({super.key});
  @override
  State<BootstrapShell> createState() => _BootstrapShellState();
}

class _BootstrapShellState extends State<BootstrapShell> {
  AppSession? _session;
  String? _error;

  @override
  void initState() {
    super.initState();
    unawaited(_initialize());
  }

  Future<void> _initialize() async {
    setState(() => _error = null);
    try {
      final session = await bootstrapApp();
      if (!mounted) {
        session.auth.dispose();
        return;
      }
      setState(() => _session = session);
    } on ConfigurationFailure catch (failure) {
      if (mounted) setState(() => _error = failure.message);
    } catch (_) {
      if (mounted)
        setState(
          () => _error =
              'Firebase could not initialize. Check the local app configuration and connection, then retry.',
        );
    }
  }

  @override
  void dispose() {
    _session?.auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_session != null)
      return CarbonLensApp(auth: _session!.auth, config: _session!.config);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: carbonLensTheme(),
      home: PageShell(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandMark(),
            const SizedBox(height: 32),
            if (_error == null) ...[
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              const Text('Preparing your green journey...'),
            ] else ...[
              MessageBox(message: _error!, isError: true),
              FilledButton(
                onPressed: _initialize,
                child: const Text('Retry setup'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
