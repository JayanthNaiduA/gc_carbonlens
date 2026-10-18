import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../app/widgets/action_form.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/auth/auth_controller.dart';

class GreenMoveScreen extends StatefulWidget {
  const GreenMoveScreen({
    super.key,
    required this.repository,
    required this.auth,
  });
  final CarbonLensRepository repository;
  final AuthController auth;
  @override
  State<GreenMoveScreen> createState() => _GreenMoveScreenState();
}

class _GreenMoveScreenState extends State<GreenMoveScreen> {
  int mode = 0;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      ChoiceTabs(
        labels: const ['Walk', 'Cycle', 'Commute'],
        selected: mode,
        onChanged: (v) => setState(() => mode = v),
      ),
      const SizedBox(height: 16),
      GreenCard(
        child: Column(
          children: [
            MetricRow(
              mode == 1 ? Icons.directions_bike : Icons.directions_walk,
              'Today',
              widget.repository.isDemo
                  ? '3.8 km · demo'
                  : 'No trusted activity yet',
            ),
            MetricRow(
              Icons.eco_outlined,
              'Estimated CO2e avoided',
              widget.repository.isDemo
                  ? '0.9 kg · illustrative'
                  : 'Requires a verified substitution',
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),
      const _RouteDiagram(),
      const SizedBox(height: 16),
      const MessageBox(
        message:
            'A recreational walk does not automatically avoid transport emissions. Register the journey it replaces and provide trusted activity evidence.',
      ),
      EvidenceForm(
        key: ValueKey(mode),
        repository: widget.repository,
        path: '/v1/green-move',
        label: 'Submit commute evidence',
        fields: const {
          'baseline_id': 'Registered commute baseline',
          'session_id': 'Health Connect session reference',
        },
        body: (v) => {
          'baseline_id': v['baseline_id'],
          'session_ref': v['session_id'],
          'actual_mode': mode == 1 ? 'CYCLE' : 'WALK',
        },
        guard: () =>
            widget.auth.consent?.healthConnect != true ||
                widget.auth.consent?.location != true
            ? 'Enable physical activity and location consent in Settings first.'
            : null,
      ),
      const SizedBox(height: 12),
      const Text(
        'Live tracking needs the Android Health Connect integration. No steps, route or location are recorded by this preview.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}

class _RouteDiagram extends StatelessWidget {
  const _RouteDiagram();
  @override
  Widget build(BuildContext context) => GreenCard(
    color: const Color(0xffe9f2e9),
    child: SizedBox(
      height: 160,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(Icons.trip_origin, color: Colors.blue, size: 32),
              Expanded(child: Divider(color: Colors.blue, thickness: 3)),
              Icon(Icons.location_on, color: green, size: 36),
            ],
          ),
          const SizedBox(height: 18),
          const Text(
            'Origin area to Destination area',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Commute diagram · live Maps not connected',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    ),
  );
}
