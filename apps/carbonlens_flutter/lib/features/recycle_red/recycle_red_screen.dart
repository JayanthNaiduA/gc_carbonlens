import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../app/widgets/action_form.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/auth/auth_controller.dart';

class RecycleRedScreen extends StatelessWidget {
  const RecycleRedScreen({
    super.key,
    required this.repository,
    required this.auth,
  });
  final CarbonLensRepository repository;
  final AuthController auth;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const GreenCard(
        color: Color(0xffffeeee),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Icon(Icons.devices, size: 80, color: ink),
            ),
            Icon(Icons.receipt_long, size: 80, color: Color(0xffc56f6f)),
          ],
        ),
      ),
      SectionTitle('Verify safe electronics hand-off'),
      const MessageBox(
        message:
            'Provide an item photo and a receipt or certificate from a verified recycler. A waste photo alone does not earn rewards.',
      ),
      EvidenceForm(
        repository: repository,
        path: '/v1/recycle-red/claims',
        label: 'Submit recycling claim',
        fields: const {
          'category': 'Item category',
          'weight': 'Weight (kg)',
          'recycler': 'Verified recycler reference',
          'photo': 'Private item photo reference',
          'document': 'Private receipt or certificate reference',
        },
        body: (v) => {
          'item_category': v['category'],
          'weight_kg': double.parse(v['weight']!),
          'recycler_id': v['recycler'],
          'item_photo': v['photo'],
          'storage_object': v['document'],
        },
        guard: () => auth.consent?.camera != true
            ? 'Enable camera consent before processing document evidence.'
            : null,
      ),
      const SizedBox(height: 16),
      const GreenCard(
        color: mint,
        child: Column(
          children: [
            MetricRow(
              Icons.verified_user_outlined,
              'Recycler registry',
              'Required',
            ),
            MetricRow(Icons.fingerprint, 'Unique certificate', 'Required'),
            MetricRow(
              Icons.eco_outlined,
              'Carbon benefit',
              'Sourced factors only',
            ),
          ],
        ),
      ),
      const SizedBox(height: 12),
      const Text(
        'No serial numbers are requested. Duplicate certificates are checked across accounts.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}
