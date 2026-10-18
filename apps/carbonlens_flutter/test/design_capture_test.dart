import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/app/routes.dart';
import 'package:carbonlens_flutter/core/auth/auth_controller.dart';
import 'package:carbonlens_flutter/core/auth/demo_auth_service.dart';
import 'package:carbonlens_flutter/core/consent/consent_state.dart';

void main() {
  testWidgets(
    'capture actual Flutter mobile and web designs and navigate every screen',
    (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(390, 900);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final auth = AuthController(DemoAuthService());
      addTearDown(auth.dispose);
      await tester.runAsync(() async {
        final font = File(
          '../../.tools/flutter-sdk/flutter/engine/src/flutter/txt/third_party/fonts/Roboto-Regular.ttf',
        );
        if (await font.exists()) {
          final loader = FontLoader('Roboto')
            ..addFont(
              font.readAsBytes().then((bytes) => ByteData.sublistView(bytes)),
            );
          await loader.load();
        }
        final icons = FontLoader('MaterialIcons')
          ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
        await icons.load();
      });
      final captureKey = GlobalKey();
      await tester.pumpWidget(
        RepaintBoundary(
          key: captureKey,
          child: CarbonLensApp(auth: auth),
        ),
      );
      Future<void> capture(String name) async {
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        final boundary =
            captureKey.currentContext!.findRenderObject()!
                as RenderRepaintBoundary;
        await tester.runAsync(() async {
          final image = await boundary.toImage(pixelRatio: 1);
          final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
          final directory = Directory('../../docs/verification');
          await directory.create(recursive: true);
          await File(
            '${directory.path}/$name.png',
          ).writeAsBytes(bytes!.buffer.asUint8List());
          image.dispose();
        });
      }

      await capture('mobile-login');
      await tester.ensureVisible(find.byKey(const Key('demo-sign-in')));
      await tester.tap(find.byKey(const Key('demo-sign-in')));
      await capture('mobile-consent');
      await tester.ensureVisible(find.byKey(const Key('consent-continue')));
      await tester.tap(find.byKey(const Key('consent-continue')));
      await capture('mobile-home');
      await tester.tap(find.text('Scan').last);
      await tester.pumpAndSettle();
      for (final scroll in tester.stateList<ScrollableState>(
        find.byType(Scrollable),
      )) {
        if (scroll.position.hasPixels)
          scroll.position.jumpTo(scroll.position.minScrollExtent);
      }
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('sample-scan')));
      await tester.tap(find.byKey(const Key('sample-scan')));
      await capture('mobile-result');
      await tester.ensureVisible(find.text('Add to My Impact'));
      await tester.tap(find.text('Add to My Impact'));
      await tester.pumpAndSettle();
      expect(
        find.textContaining('no verified purchase evidence'),
        findsOneWidget,
      );
      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();
      // Narrow screen and large text must remain scrollable without overflow.
      tester.view.physicalSize = const Size(320, 900);
      tester.platformDispatcher.textScaleFactorTestValue = 1.6;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      tester.platformDispatcher.clearTextScaleFactorTestValue();
      tester.view.physicalSize = const Size(1200, 900);
      await tester.pumpAndSettle();
      for (final page in [
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
      ]) {
        await tester.tap(find.widgetWithText(ListTile, page).first);
        await capture('web-${page.toLowerCase().replaceAll(' ', '-')}');
      }
      await tester.ensureVisible(find.byKey(const Key('sign-out')));
      await tester.tap(find.byKey(const Key('sign-out')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('demo-sign-in')), findsOneWidget);
    },
  );

  testWidgets(
    'consent withdrawal removes feature pages and does not retain a scan',
    (tester) async {
      final auth = AuthController(DemoAuthService());
      addTearDown(auth.dispose);
      await auth.continueAsDemo();
      auth.acceptConsent(const ConsentState());
      await tester.pumpWidget(CarbonLensApp(auth: auth));
      await tester.pumpAndSettle();
      auth.editConsent();
      await tester.pumpAndSettle();
      expect(find.text('Your data. Your choice.'), findsOneWidget);
      expect(find.text('Your Green Score'), findsNothing);
    },
  );
}
