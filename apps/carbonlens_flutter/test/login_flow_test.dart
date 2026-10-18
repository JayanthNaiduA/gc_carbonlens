import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/app/routes.dart';
import 'package:carbonlens_flutter/core/auth/auth_controller.dart';
import 'package:carbonlens_flutter/core/auth/demo_auth_service.dart';

void main() {
  testWidgets('demo login -> optional consent -> dashboard -> sign-out', (
    tester,
  ) async {
    final auth = AuthController(DemoAuthService());
    addTearDown(auth.dispose);
    await tester.pumpWidget(CarbonLensApp(auth: auth));
    expect(find.textContaining('LOCAL DEMO'), findsOneWidget);
    await tester.ensureVisible(find.byKey(const Key('demo-sign-in')));
    await tester.tap(find.byKey(const Key('demo-sign-in')));
    await tester.pumpAndSettle();
    expect(find.text('Your data. Your choice.'), findsOneWidget);
    final switches = tester.widgetList<SwitchListTile>(
      find.byType(SwitchListTile),
    );
    expect(switches.every((widget) => !widget.value), isTrue);
    await tester.ensureVisible(find.byKey(const Key('consent-continue')));
    await tester.tap(find.byKey(const Key('consent-continue')));
    await tester.pumpAndSettle();
    expect(find.text('Hello, John'), findsOneWidget);
    expect(find.textContaining('Illustrative data'), findsOneWidget);
    await tester.tap(find.byTooltip('Privacy & account'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('sign-out')));
    await tester.tap(find.byKey(const Key('sign-out')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('demo-sign-in')), findsOneWidget);
  });
}
