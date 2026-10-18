import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/api/api_errors.dart';
import '../../core/auth/auth_controller.dart';

class AiScreen extends StatefulWidget {
  const AiScreen({
    super.key,
    required this.repository,
    required this.auth,
    this.initialScanId,
  });
  final CarbonLensRepository repository;
  final AuthController auth;
  final String? initialScanId;
  @override
  State<AiScreen> createState() => _AiScreenState();
}

class _AiScreenState extends State<AiScreen> {
  late final scanId = TextEditingController(text: widget.initialScanId);
  bool busy = false;
  String? answer;
  Future<void> explain() async {
    if (scanId.text.trim().isEmpty) {
      setState(
        () => answer =
            'Enter a completed scan ID so the explanation can use trusted facts.',
      );
      return;
    }
    if (widget.auth.consent?.personalization != true) {
      setState(
        () => answer = 'Enable personalized suggestions in Settings first.',
      );
      return;
    }
    setState(() {
      busy = true;
      answer = null;
    });
    try {
      final result = await widget.repository.mutate('/v1/ai/explain', {
        'scan_id': scanId.text.trim(),
      }, operationKey());
      if (mounted)
        setState(
          () => answer =
              '${result['summary']}\n\n${result['recommended_action']}\n\n${result['confidence_note']}',
        );
    } on ApiFailure catch (failure) {
      if (mounted) setState(() => answer = failure.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
    scanId.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const Center(child: TreeMascot()),
      const Text(
        'Hi John,\nI’m CarbonLens AI',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
      ),
      const SizedBox(height: 10),
      const Text(
        'Understand your choices and find practical greener alternatives.',
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 20),
      for (final prompt in [
        'How can I reduce my plastic use?',
        'Explain my carbon footprint',
        'How do Green Points work?',
      ])
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              backgroundColor: const Color(0xfff1efff),
            ),
            onPressed: () => setState(
              () => answer = prompt.contains('Points')
                  ? 'Green Points are policy-based loyalty rewards. Only the server can issue them after evidence verification. They are separate from carbon estimates.'
                  : prompt.contains('plastic')
                  ? 'Consider reusable items when practical, compare their durability and use local recycling guidance. Scan a product for a sourced comparison.'
                  : 'A footprint is quantity multiplied by a versioned emission factor. Review the calculation method, lifecycle boundary and confidence in your scan result.',
            ),
            child: Text(prompt),
          ),
        ),
      const SizedBox(height: 12),
      if (answer != null)
        GreenCard(color: const Color(0xfff1efff), child: Text(answer!)),
      const SizedBox(height: 16),
      TextField(
        controller: scanId,
        enabled: !busy,
        decoration: const InputDecoration(
          labelText: 'Completed scan ID',
          hintText: 'Explain a verified scan result',
        ),
        onSubmitted: (_) => explain(),
      ),
      const SizedBox(height: 12),
      FilledButton.icon(
        onPressed: busy ? null : explain,
        icon: const Icon(Icons.send_outlined),
        label: Text(busy ? 'Preparing explanation…' : 'Explain my scan'),
      ),
      const SizedBox(height: 12),
      const Text(
        'Quick guidance above is authored, not generated. Gemini explanations use trusted scan facts; AI cannot calculate or issue points.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}
