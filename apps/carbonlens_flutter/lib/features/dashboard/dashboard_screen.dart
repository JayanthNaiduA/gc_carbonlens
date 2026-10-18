import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/api/demo_repository.dart';
import '../scan/scan_screen.dart';
import '../recommendations/recommendations_screen.dart';
import '../rewards/rewards_screen.dart';
import '../green_move/green_move_screen.dart';
import '../grow_green/grow_green_screen.dart';
import '../recycle_red/recycle_red_screen.dart';
import '../ai/ai_screen.dart';
import '../reports/reports_screen.dart';
import '../earth_pulse/earth_pulse_screen.dart';
import '../community/community_screen.dart';
import '../settings/settings_screen.dart';
import 'home_view.dart';
import '../../core/profile/profile_controller.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.controller,
    this.repository,
    this.storageBucket = '',
    this.profile,
  });
  final AuthController controller;
  final CarbonLensRepository? repository;
  final String storageBucket;
  final ProfileController? profile;
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String selected = 'Home';
  String? latestScanId;
  late final CarbonLensRepository repository =
      widget.repository ??
      (widget.controller.isDemo ? DemoRepository() : UnconfiguredRepository());
  static const destinations = [
    'Home',
    'Scan',
    'Green Buy',
    'Green Move',
    'Grow Green',
    'Recycle Red',
    'Rewards',
    'CarbonLens AI',
    'Earth Intelligence',
    'Reports',
    'Community',
    'Settings',
  ];
  static const icons = [
    Icons.home_outlined,
    Icons.document_scanner_outlined,
    Icons.shopping_bag_outlined,
    Icons.directions_walk,
    Icons.park_outlined,
    Icons.recycling,
    Icons.workspace_premium_outlined,
    Icons.smart_toy_outlined,
    Icons.public,
    Icons.bar_chart,
    Icons.groups_outlined,
    Icons.settings_outlined,
  ];
  void open(String page) {
    if (mounted) setState(() => selected = page);
  }

  void more() => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .7,
        child: ListView(
          children: [
            for (var i = 2; i < destinations.length; i++)
              ListTile(
                leading: Icon(icons[i], color: green),
                title: Text(destinations[i]),
                onTap: () {
                  Navigator.pop(context);
                  open(destinations[i]);
                },
              ),
          ],
        ),
      ),
    ),
  );
  Widget page() => switch (selected) {
    'Scan' => ScanScreen(
      repository: repository,
      auth: widget.controller,
      open: open,
      storageBucket: widget.storageBucket,
      onScan: (id) => latestScanId = id,
    ),
    'Green Buy' => RecommendationsScreen(repository: repository, open: open),
    'Green Move' => GreenMoveScreen(
      repository: repository,
      auth: widget.controller,
    ),
    'Grow Green' => GrowGreenScreen(
      repository: repository,
      auth: widget.controller,
    ),
    'Recycle Red' => RecycleRedScreen(
      repository: repository,
      auth: widget.controller,
    ),
    'Rewards' => RewardsScreen(repository: repository, open: open),
    'CarbonLens AI' => AiScreen(
      repository: repository,
      auth: widget.controller,
      initialScanId: latestScanId,
    ),
    'Earth Intelligence' => EarthPulseScreen(isDemo: repository.isDemo),
    'Reports' => ReportsScreen(repository: repository),
    'Community' => CommunityScreen(isDemo: repository.isDemo),
    'Settings' => SettingsScreen(
      auth: widget.controller,
      profile: widget.profile,
    ),
    _ => HomeView(repository: repository, open: open),
  };
  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final navIndex = switch (selected) {
      'Home' => 0,
      'Green Move' => 1,
      'Scan' => 2,
      'Rewards' => 3,
      _ => 4,
    };
    return PopScope(
      canPop: selected == 'Home',
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) open('Home');
      },
      child: Scaffold(
        appBar: AppBar(
          title: selected == 'Home'
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircleAvatar(
                      backgroundColor: mint,
                      child: Icon(Icons.person_outline, color: green),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Good Morning',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.normal,
                          ),
                        ),
                        Text(
                          'Hello, ${widget.profile?.profile?.name ?? widget.controller.user!.displayName}',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                )
              : Text(selected),
          leading: selected != 'Home' && !wide
              ? IconButton(
                  tooltip: 'Back to home',
                  onPressed: () => open('Home'),
                  icon: const Icon(Icons.chevron_left),
                )
              : null,
          actions: [
            IconButton(
              tooltip: 'Privacy & account',
              onPressed: () => open('Settings'),
              icon: const Icon(Icons.account_circle_outlined),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SafeArea(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (wide)
                Container(
                  width: 210,
                  child: ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      const ListTile(
                        leading: Icon(Icons.eco, color: green),
                        title: Text(
                          'CarbonLens',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      for (var i = 0; i < destinations.length; i++)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 3),
                          child: ListTile(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            dense: true,
                            selected: selected == destinations[i],
                            selectedTileColor: mint,
                            leading: Icon(icons[i], size: 20),
                            title: Text(destinations[i]),
                            onTap: () => open(destinations[i]),
                          ),
                        ),
                    ],
                  ),
                ),
              Expanded(
                child: SingleChildScrollView(
                  key: ValueKey(selected),
                  padding: EdgeInsets.all(wide ? 28 : 18),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 760),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (repository.isDemo)
                            const Padding(
                              padding: EdgeInsets.only(bottom: 14),
                              child: Text(
                                'DEMO · Illustrative data • No real rewards',
                                style: TextStyle(
                                  color: Color(0xff657c6c),
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          page(),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: wide
            ? null
            : NavigationBar(
                selectedIndex: navIndex,
                onDestinationSelected: (i) {
                  if (i == 4) {
                    more();
                  } else {
                    open(['Home', 'Green Move', 'Scan', 'Rewards'][i]);
                  }
                },
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.home_outlined),
                    label: 'Home',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.directions_walk),
                    label: 'Move',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.qr_code_scanner),
                    label: 'Scan',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.workspace_premium_outlined),
                    label: 'Rewards',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.more_horiz),
                    label: 'More',
                  ),
                ],
              ),
      ),
    );
  }
}
