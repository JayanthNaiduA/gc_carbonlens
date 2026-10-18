import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/api/carbonlens_repository.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key, required this.repository});
  final CarbonLensRepository repository;
  @override
  Widget build(BuildContext context) => ResourceView(
    repository: repository,
    path: '/v1/reports/monthly',
    builder: (data) {
      final weeks = (data['weekly_avoided'] as List? ?? []).cast<num>();
      final max = weeks.isEmpty
          ? 1.0
          : weeks.reduce((a, b) => a > b ? a : b).toDouble();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const GreenCard(
            padding: 12,
            child: Row(
              children: [
                Icon(Icons.calendar_month_outlined, color: green),
                SizedBox(width: 12),
                Text('This Month'),
              ],
            ),
          ),
          SectionTitle('Estimated CO2e Avoided'),
          Text(
            data['avoided_kg_co2e'] == null
                ? 'No sourced impact totals yet'
                : '${data['avoided_kg_co2e']} kg',
            style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 18),
          GreenCard(
            child: weeks.isEmpty
                ? const Text('Your verified monthly activity will appear here.')
                : SizedBox(
                    height: 200,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        for (var i = 0; i < weeks.length; i++)
                          Expanded(
                            child: Semantics(
                              label:
                                  'Week ${i + 1}: ${weeks[i]} kilograms avoided',
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    '${weeks[i]}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    width: 30,
                                    height: max <= 0
                                        ? 0
                                        : (weeks[i] / max * 135)
                                              .clamp(0, 135)
                                              .toDouble(),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(5),
                                      gradient: const LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [Color(0xff42c58a), green],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    'Week ${i + 1}',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
          SectionTitle('By Category'),
          GreenCard(
            child: Column(
              children: [
                if ((data['categories'] as List? ?? []).isEmpty)
                  const Text('No category breakdown available yet.'),
                for (final item in data['categories'] as List? ?? [])
                  MetricRow(
                    switch (item['name']) {
                      'Transport' => Icons.directions_car_outlined,
                      'Recycling' => Icons.recycling,
                      'Trees' => Icons.park_outlined,
                      _ => Icons.shopping_bag_outlined,
                    },
                    item['name'].toString(),
                    '${item['value']} kg',
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Carbon estimates, Green Points and sustainability scores remain separate. Illustrative tree/recycling figures are not scientific claims.',
            style: TextStyle(fontSize: 12),
          ),
        ],
      );
    },
  );
}
