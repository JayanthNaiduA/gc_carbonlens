import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/api/api_errors.dart';
import '../../core/models/carbon_result.dart';
import '../../core/models/sustainability_score.dart';

class ScanResultScreen extends StatelessWidget {
  const ScanResultScreen({
    super.key,
    required this.repository,
    required this.result,
    required this.open,
    required this.back,
    required this.receiptScan,
  });
  final CarbonLensRepository repository;
  final Map<String, dynamic> result;
  final ValueChanged<String> open;
  final VoidCallback back;
  final VoidCallback receiptScan;
  @override
  Widget build(BuildContext context) {
    try {
      final carbon = CarbonResult.fromJson(
        Map<String, dynamic>.from(result['carbon'] as Map),
      );
      final score = SustainabilityScore.fromJson(
        Map<String, dynamic>.from(result['sustainability'] as Map),
      );
      final product = Map<String, dynamic>.from(
        result['product_candidate'] as Map,
      );
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: back,
              icon: const Icon(Icons.chevron_left),
              label: const Text('New scan'),
            ),
          ),
          GreenCard(
            child: Row(
              children: [
                ProductArt(
                  kind: product['icon'] as String? ?? 'brush',
                  size: 110,
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product['name'] as String? ??
                            product['category'] as String? ??
                            'Product',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(product['brand'] as String? ?? ''),
                      const SizedBox(height: 10),
                      const Text(
                        'Product analysis',
                        style: TextStyle(
                          color: green,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SectionTitle('Carbon footprint'),
          GreenCard(
            color: mint,
            child: Row(
              children: [
                const Icon(Icons.eco_outlined, color: green, size: 32),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${carbon.estimated.toStringAsFixed(2)} kg CO2e',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(carbon.boundary),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SectionTitle('Sustainability Score'),
          GreenCard(
            child: Column(
              children: [
                MetricRow(
                  Icons.eco_outlined,
                  'Separate product score',
                  '${score.score} / 100',
                ),
                for (final entry in score.dimensions.entries)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(entry.key.replaceAll('_', ' ')),
                        const SizedBox(height: 6),
                        LinearProgressIndicator(
                          value: entry.value.toDouble() / 100,
                          minHeight: 6,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          SectionTitle('Greener alternative impact'),
          const GreenCard(
            child: Row(
              children: [
                Icon(Icons.park_outlined, color: green, size: 38),
                SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Compare a product in the same category. Avoided emissions require a sourced, comparable baseline.',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const GreenCard(
            color: Color(0xfffff7df),
            child: Row(
              children: [
                Icon(Icons.workspace_premium, color: Color(0xffd4a000)),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Green Points require unique purchase evidence and a server verification decision.',
                  ),
                ),
              ],
            ),
          ),
          ExpansionTile(
            title: const Text('Method, confidence & source'),
            children: [
              ListTile(
                title: Text(carbon.method),
                subtitle: Text(
                  '${carbon.source}\nFactor version: ${carbon.factorVersion}\nConfidence: ${carbon.confidence}\nScore policy: ${score.version}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              if (!repository.isDemo && result['receipt_scan_id'] == null) {
                receiptScan();
              } else {
                showDialog<void>(
                  context: context,
                  builder: (_) =>
                      _ImpactDialog(repository: repository, result: result),
                );
              }
            },
            child: const Text('Add to My Impact'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => open('Green Buy'),
            child: const Text('View Similar Products'),
          ),
          TextButton(
            onPressed: () => open('CarbonLens AI'),
            child: const Text('Ask CarbonLens AI'),
          ),
        ],
      );
    } catch (_) {
      return const MessageBox(
        message: 'This scan has an unsupported result. Retry the scan.',
        isError: true,
      );
    }
  }
}

class _ImpactDialog extends StatefulWidget {
  const _ImpactDialog({required this.repository, required this.result});
  final CarbonLensRepository repository;
  final Map<String, dynamic> result;
  @override
  State<_ImpactDialog> createState() => _ImpactDialogState();
}

class _ImpactDialogState extends State<_ImpactDialog> {
  final baseline = TextEditingController();
  final form = GlobalKey<FormState>();
  String key = operationKey();
  String? message;
  bool busy = false;
  @override
  void dispose() {
    baseline.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    if (widget.result['baseline_scans']?[baseline.text.trim()] == null) {
      setState(
        () => message =
            'Scan the conventional product first, then scan its replacement and purchase receipt. A catalog selection alone cannot verify a replacement.',
      );
      return;
    }
    setState(() {
      busy = true;
      message = null;
    });
    try {
      final event = await widget.repository.mutate('/v1/green-events', {
        'action_type': 'GO_GREEN_PRODUCT',
        'subject': {
          'baseline_ref': baseline.text.trim(),
          'actual_ref': widget.result['product_candidate']['product_ref'],
        },
        'evidence_refs': [
          if (widget.result['baseline_scans']?[baseline.text.trim()] != null)
            'scans/${widget.result['baseline_scans'][baseline.text.trim()]}',
          'scans/${widget.result['scan_id']}',
          'scans/${widget.result['receipt_scan_id']}',
        ],
      }, key);
      final decision = await widget.repository.mutate('/v1/rewards/evaluate', {
        'event_id': event['event_id'],
      }, '${key}_reward');
      if (mounted)
        setState(
          () => message =
              '${decision['state']} · ${decision['points']} GP. Reopen Rewards to refresh your wallet.',
        );
    } on ApiFailure catch (failure) {
      if (mounted) setState(() => message = failure.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Verify your replacement'),
    content: SizedBox(
      width: 400,
      child: SingleChildScrollView(
        child: widget.repository.isDemo
            ? const Text(
                'This illustrative product has no verified purchase evidence. The demo does not issue Green Points.',
              )
            : Form(
                key: form,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ResourceView(
                      repository: widget.repository,
                      path: '/v1/products',
                      builder: (data) {
                        final actual = widget.result['product_candidate'];
                        final candidates = (data['products'] as List? ?? [])
                            .where(
                              (p) =>
                                  p['category'] == actual['category'] &&
                                  p['product_ref'] != actual['product_ref'],
                            )
                            .toList();
                        if (candidates.isEmpty)
                          return const Text(
                            'No sourced conventional baseline is available for this category.',
                          );
                        return DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            labelText: 'Product being replaced',
                          ),
                          isExpanded: true,
                          items: [
                            for (final p in candidates)
                              DropdownMenuItem(
                                value: p['product_ref'] as String,
                                child: Text(
                                  p['name']?.toString() ??
                                      p['product_ref'].toString(),
                                ),
                              ),
                          ],
                          onChanged: busy
                              ? null
                              : (value) {
                                  baseline.text = value ?? '';
                                  key = operationKey();
                                },
                          validator: (value) => value == null
                              ? 'Choose the conventional product.'
                              : null,
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Your scanned purchase receipt will be checked for a product match and duplicate evidence.',
                    ),
                    if (message != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(message!),
                      ),
                  ],
                ),
              ),
      ),
    ),
    actions: [
      TextButton(
        onPressed: busy ? null : () => Navigator.pop(context),
        child: const Text('Close'),
      ),
      if (!widget.repository.isDemo)
        FilledButton(
          onPressed: busy ? null : submit,
          child: Text(busy ? 'Verifying…' : 'Submit evidence'),
        ),
    ],
  );
}
