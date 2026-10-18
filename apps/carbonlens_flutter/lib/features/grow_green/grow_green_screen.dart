import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../app/widgets/action_form.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/auth/auth_controller.dart';

class GrowGreenScreen extends StatefulWidget {
  const GrowGreenScreen({
    super.key,
    required this.repository,
    required this.auth,
  });
  final CarbonLensRepository repository;
  final AuthController auth;
  @override
  State<GrowGreenScreen> createState() => _GrowGreenScreenState();
}

class _GrowGreenScreenState extends State<GrowGreenScreen> {
  int tab = 0;
  String? projectId;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      ChoiceTabs(
        labels: const ['Plant', 'My Trees', 'Impact'],
        selected: tab,
        onChanged: (v) => setState(() => tab = v),
      ),
      const SizedBox(height: 16),
      if (tab == 0) ...[
        const GreenCard(
          color: mint,
          child: Column(
            children: [
              TreeMascot(),
              Text(
                'Plant today. Help it thrive.',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
        SectionTitle('Register a private planting plot'),
        EvidenceForm(
          repository: widget.repository,
          path: '/v1/grow-green/projects',
          label: 'Register planting plot',
          fields: const {
            'count': 'Trees planted',
            'species': 'Species',
            'lat': 'Latitude',
            'lng': 'Longitude',
          },
          body: (v) => {
            'claimed_count': int.parse(v['count']!),
            'species': v['species'],
            'location': {
              'lat': double.parse(v['lat']!),
              'lng': double.parse(v['lng']!),
            },
            'privacy_mode': 'PRIVATE',
          },
          guard: () => widget.auth.consent?.location != true
              ? 'Enable location consent before registering a plot.'
              : null,
          success: (result) {
            projectId = result['project_id'] as String?;
            return 'Plot registered as PENDING. Add fresh check-in evidence to request verification.';
          },
        ),
        const SizedBox(height: 16),
        const MessageBox(
          message:
              'Plots are private by default. Planting, survival and carbon estimates are separate. Maps and satellite images cannot prove an individual sapling survives.',
        ),
      ] else if (tab == 1) ...[
        ResourceView(
          repository: widget.repository,
          path: '/v1/grow-green/projects',
          builder: (data) => Column(
            children: [
              if ((data['projects'] as List? ?? []).isEmpty)
                const GreenCard(
                  child: Text(
                    'No registered trees yet. Register a plot in Plant to start.',
                  ),
                ),
              for (final project in data['projects'] as List? ?? [])
                GreenCard(
                  child: ListTile(
                    leading: const Icon(Icons.park, color: green),
                    title: Text(
                      '${project['claimed_count']} trees · ${project['species']}',
                    ),
                    subtitle: Text('${project['state']} · Private plot'),
                  ),
                ),
            ],
          ),
        ),
        SectionTitle('Fresh check-in'),
        EvidenceForm(
          repository: widget.repository,
          path: '/v1/grow-green/${projectId ?? 'unselected'}/checkins',
          label: 'Submit for verification',
          fields: const {
            'photo': 'Private fresh photo reference',
            'checkpoint':
                'Checkpoint (DAY_0, DAY_30, DAY_90, DAY_180, DAY_365)',
          },
          body: (v) => {
            'storage_object': v['photo'],
            'checkpoint': v['checkpoint'],
            'captured_at': DateTime.now().toUtc().toIso8601String(),
          },
          guard: () => projectId == null
              ? 'Register a plot in Plant first.'
              : widget.auth.consent?.location != true
              ? 'Location consent is required.'
              : null,
        ),
      ] else ...[
        SectionTitle('Persistence checkpoints'),
        const GreenCard(
          child: Column(
            children: [
              MetricRow(
                Icons.photo_camera_outlined,
                'Day 0 · planting evidence',
                'PENDING',
              ),
              MetricRow(
                Icons.schedule,
                'Day 30 · fresh owner check-in',
                'PROVISIONAL',
              ),
              MetricRow(
                Icons.people_outline,
                'Day 90 · optional visitor',
                'PROVISIONAL',
              ),
              MetricRow(
                Icons.park_outlined,
                'Day 180 · persistence',
                'PROVISIONAL',
              ),
              MetricRow(
                Icons.verified_outlined,
                'Day 365 · verified survival',
                'VESTED',
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Checkpoints require fresh evidence near your plot. Reused photos and self-confirmations cannot establish independent verification.',
        ),
      ],
    ],
  );
}
