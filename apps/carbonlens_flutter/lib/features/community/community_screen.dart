import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key, required this.isDemo});
  final bool isDemo;
  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  int scope = 0;
  static const names = [
    'Member A',
    'Member B',
    'Member C',
    'You (John)',
    'Member D',
    'Member E',
  ];
  static const points = [2840, 2410, 2380, 1420, 1210, 980];
  @override
  Widget build(BuildContext context) => Column(
    children: [
      ChoiceTabs(
        labels: const ['Global', 'Friends', 'Local'],
        selected: scope,
        onChanged: (v) => setState(() => scope = v),
      ),
      const SizedBox(height: 16),
      if (!widget.isDemo || scope != 0)
        const GreenCard(
          child: Text(
            'No opt-in leaderboard is connected. Your profile and precise location remain private.',
          ),
        )
      else ...[
        for (var i = 0; i < names.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GreenCard(
              color: i == 3 ? const Color(0xfffff7d9) : Colors.white,
              padding: 12,
              child: Row(
                children: [
                  SizedBox(
                    width: 28,
                    child: i == 0
                        ? const Icon(
                            Icons.emoji_events_outlined,
                            color: Color(0xffd2aa00),
                          )
                        : Text(
                            '${i + 1}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: green,
                            ),
                          ),
                  ),
                  const CircleAvatar(
                    backgroundColor: mint,
                    child: Icon(Icons.person_outline, color: green),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Text(names[i])),
                  Text(
                    '${points[i]} GP',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ),
      ],
      const SizedBox(height: 14),
      const Text(
        'Demo ranking · simulated members and balances. Real community participation will require explicit opt-in.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}
