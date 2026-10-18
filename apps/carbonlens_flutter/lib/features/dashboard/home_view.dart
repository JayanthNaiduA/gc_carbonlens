import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/api/carbonlens_repository.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key, required this.repository, required this.open});
  final CarbonLensRepository repository;
  final ValueChanged<String> open;
  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  int period = 0;
  @override
  Widget build(BuildContext context) => ResourceView(
    repository: widget.repository,
    path: '/v1/dashboard?period=${['today', 'week', 'month'][period]}',
    builder: (data) {
      final score = data['green_score'];
      String value(String key, String unit) =>
          data[key] == null ? '—' : '${data[key]}$unit';
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                colors: [Color(0xff00a66b), Color(0xff007749)],
              ),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 29,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.eco_outlined, color: green, size: 38),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Your Green Score',
                        style: TextStyle(color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        score == null
                            ? 'Awaiting verified actions'
                            : '$score / 100',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 12),
                      LinearProgressIndicator(
                        value: score == null
                            ? 0
                            : (score as num).toDouble() / 100,
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(6),
                        color: const Color(0xffa9efc3),
                        backgroundColor: Colors.white24,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ChoiceTabs(
            labels: const ['Today', 'Week', 'Month'],
            selected: period,
            onChanged: (v) => setState(() => period = v),
          ),
          const SizedBox(height: 10),
          GreenCard(
            child: Column(
              children: [
                MetricRow(
                  Icons.directions_walk,
                  'Walking',
                  value('walking_km', ' km'),
                ),
                const Divider(height: 1),
                MetricRow(
                  Icons.shopping_bag_outlined,
                  'Greener purchases',
                  value('greener_purchases', ''),
                ),
                const Divider(height: 1),
                MetricRow(
                  Icons.cloud_outlined,
                  'Estimated CO2e avoided',
                  value('avoided_kg_co2e', ' kg'),
                ),
                const Divider(height: 1),
                MetricRow(
                  Icons.workspace_premium_outlined,
                  'Green Points',
                  value('points_earned', ' GP'),
                  highlight: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          GreenCard(
            color: mint,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Current Balance'),
                      Text(
                        '${data['wallet']?['available_points'] ?? 0} GP',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 24,
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => widget.open('Rewards'),
                  child: const Text('View Rewards'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          GreenCard(
            color: const Color(0xfff0efff),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.smart_toy_outlined,
                  color: Color(0xff7772d5),
                  size: 32,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'AI Insight',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        data['insight'] as String? ??
                            'Make one greener choice today.',
                      ),
                      TextButton(
                        onPressed: () => widget.open('Green Buy'),
                        child: const Text('Explore alternatives'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SectionTitle('Quick actions'),
          LayoutBuilder(
            builder: (context, constraints) => Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (final action in [
                  ('Scan', Icons.document_scanner_outlined),
                  ('Green Move', Icons.directions_walk),
                  ('Grow Green', Icons.park_outlined),
                  ('Recycle Red', Icons.recycling),
                ])
                  SizedBox(
                    width: (constraints.maxWidth - 10) / 2,
                    child: OutlinedButton.icon(
                      onPressed: () => widget.open(action.$1),
                      icon: Icon(action.$2),
                      label: Text(action.$1),
                    ),
                  ),
              ],
            ),
          ),
        ],
      );
    },
  );
}
