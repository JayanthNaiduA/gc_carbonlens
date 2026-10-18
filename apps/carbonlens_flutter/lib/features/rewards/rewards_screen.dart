import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/api/carbonlens_repository.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({
    super.key,
    required this.repository,
    required this.open,
  });
  final CarbonLensRepository repository;
  final ValueChanged<String> open;
  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  int filter = 0;
  bool history = false;
  @override
  Widget build(BuildContext context) => ResourceView(
    repository: widget.repository,
    path: '/v1/wallet',
    builder: (data) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: const LinearGradient(colors: [Color(0xff68cf9d), green]),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your Balance', style: TextStyle(color: Colors.white)),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${data['available_points'] ?? 0} GP',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  TextButton(
                    style: TextButton.styleFrom(foregroundColor: Colors.white),
                    onPressed: () => setState(() => history = !history),
                    child: Text(history ? 'View actions' : 'View History'),
                  ),
                ],
              ),
              Text(
                '${data['provisional_points'] ?? 0} GP provisional · awaiting verification',
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ChoiceTabs(
          labels: const ['All', 'Vouchers', 'Products', 'Donations'],
          selected: filter,
          onChanged: (v) => setState(() => filter = v),
        ),
        const SizedBox(height: 16),
        if (history) ...[
          SectionTitle('Reward history'),
          if ((data['entries'] as List? ?? []).isEmpty)
            const GreenCard(
              child: Text(
                'No reward entries yet. Verify a green action to begin.',
              ),
            ),
          for (final entry in data['entries'] as List? ?? [])
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GreenCard(
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.workspace_premium_outlined,
                    color: green,
                  ),
                  title: Text(
                    '${entry['points_delta']} GP · ${entry['entry_type']}',
                  ),
                  subtitle: Text(
                    '${entry['event_id']}\nPolicy: ${entry['policy_version']}',
                  ),
                ),
              ),
            ),
        ] else if (filter != 0)
          const GreenCard(
            child: Text(
              'Redemption options are not configured. Your verified balance stays available.',
            ),
          )
        else ...[
          for (final action in [
            ('Green Buy', Icons.shopping_cart_outlined, mint),
            ('Green Move', Icons.directions_walk, const Color(0xffeaf2fa)),
            ('Recycle Red', Icons.recycling, const Color(0xffffefef)),
            ('Grow Green', Icons.park_outlined, const Color(0xffeff7e8)),
          ])
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GreenCard(
                color: action.$3,
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(
                    action.$2,
                    size: 38,
                    color: action.$1 == 'Recycle Red'
                        ? Colors.redAccent
                        : green,
                  ),
                  title: Text(
                    action.$1,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: const Text(
                    'Verify an action · policy-based rewards',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => widget.open(action.$1),
                ),
              ),
            ),
        ],
        const SizedBox(height: 8),
        const Text(
          'Green Points are distinct from estimated CO2e and are not tradable carbon credits.',
          style: TextStyle(fontSize: 12),
        ),
      ],
    ),
  );
}
