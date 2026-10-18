import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';

class EarthPulseScreen extends StatefulWidget {
  const EarthPulseScreen({super.key, required this.isDemo});
  final bool isDemo;
  @override
  State<EarthPulseScreen> createState() => _EarthPulseScreenState();
}

class _EarthPulseScreenState extends State<EarthPulseScreen> {
  int tab = 0;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      ChoiceTabs(
        labels: const ['News', 'Insights', 'Local'],
        selected: tab,
        onChanged: (v) => setState(() => tab = v),
      ),
      const SizedBox(height: 16),
      if (tab == 0) ...[
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: const Landscape(),
        ),
        const SizedBox(height: 14),
        const Text(
          'A greener Earth starts with everyday choices',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        const Text('Illustrated landscape · editorial guidance'),
        SectionTitle('Reduce repeated packaging'),
        const GreenCard(
          child: Text(
            'Choose a reusable bag, use refill options where available and follow local recycling guidance.',
          ),
        ),
      ] else if (tab == 1)
        const GreenCard(
          child: Text(
            'Your impact insights will use sourced, verified activity. There is no live news or environmental data provider configured.',
          ),
        )
      else
        const GreenCard(
          child: Text(
            'Local discovery needs an approved location-aware source. Your location is not collected by this screen.',
          ),
        ),
      const SizedBox(height: 16),
      const Text(
        'Earth Intelligence is a phase 2 feature. No fabricated news, publication dates or environmental statistics are shown.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}
