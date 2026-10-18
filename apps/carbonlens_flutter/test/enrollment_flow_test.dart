import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:carbonlens_flutter/app/routes.dart';
import 'package:carbonlens_flutter/app/theme.dart';
import 'package:carbonlens_flutter/core/api/api_errors.dart';
import 'package:carbonlens_flutter/core/auth/auth_controller.dart';
import 'package:carbonlens_flutter/core/auth/auth_service.dart';
import 'package:carbonlens_flutter/core/auth/phone_auth.dart';
import 'package:carbonlens_flutter/features/auth/phone_screen.dart';
import 'helpers/test_account_service.dart';
import 'helpers/test_profile_repository.dart';

void main() {
  Future<void> fonts(WidgetTester tester) => tester.runAsync(() async {
    final font = File(
      '../../.tools/flutter-sdk/flutter/engine/src/flutter/txt/third_party/fonts/Roboto-Regular.ttf',
    );
    if (await font.exists()) {
      await (FontLoader(
        'Roboto',
      )..addFont(font.readAsBytes().then(ByteData.sublistView))).load();
    }
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  Future<void> capture(WidgetTester tester, GlobalKey key, String name) async {
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    final boundary =
        key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
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

  void mobile(WidgetTester tester) {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 900);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  }

  testWidgets(
    'new identity validates and persists enrollment before privacy and home; profile edits and logout work',
    (tester) async {
      mobile(tester);
      await fonts(tester);
      final service = TestAccountService()..setUser('test-user');
      final auth = AuthController(service);
      addTearDown(auth.dispose);
      final repository = TestProfileRepository();
      final key = GlobalKey();
      await tester.pumpWidget(
        RepaintBoundary(
          key: key,
          child: CarbonLensApp(auth: auth, repository: repository),
        ),
      );
      await capture(tester, key, 'auth-enrollment');
      expect(find.text('Complete your profile'), findsOneWidget);
      await tester.tap(find.byKey(const Key('save-profile')));
      await tester.pumpAndSettle();
      expect(
        find.text('Use a two-letter country/region code.'),
        findsOneWidget,
      );
      expect(repository.saves, 0);
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Country / region code'),
        'IN',
      );
      repository.saveFailure = const ApiFailure(
        'OFFLINE',
        'Profile save unavailable.',
      );
      await tester.tap(find.byKey(const Key('save-profile')));
      await tester.pumpAndSettle();
      expect(find.text('Complete your profile'), findsOneWidget);
      expect(find.text('Profile save unavailable.'), findsOneWidget);
      repository.saveFailure = null;
      await tester.tap(find.byKey(const Key('save-profile')));
      await tester.pumpAndSettle();
      expect(find.text('Your data. Your choice.'), findsOneWidget);
      await tester.ensureVisible(find.byKey(const Key('consent-continue')));
      await tester.tap(find.byKey(const Key('consent-continue')));
      await tester.pumpAndSettle();
      expect(find.text('Your Green Score'), findsOneWidget);
      expect(repository.complete, isTrue);
      await tester.tap(find.byTooltip('Privacy & account'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('View and edit profile'));
      await tester.tap(find.text('View and edit profile'));
      await capture(tester, key, 'auth-profile');
      expect(find.text('Your profile'), findsOneWidget);
      await tester.tap(find.text('Edit profile'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('profile-name')),
        'John Updated',
      );
      await tester.ensureVisible(find.text('Cancel'));
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(repository.name, 'John');
      await tester.ensureVisible(find.text('Edit profile'));
      await tester.tap(find.text('Edit profile'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('profile-name')),
        'John Updated',
      );
      await tester.ensureVisible(find.byKey(const Key('save-profile')));
      await tester.tap(find.byKey(const Key('save-profile')));
      await tester.pumpAndSettle();
      expect(repository.name, 'John Updated');
      await tester.ensureVisible(find.text('Sign out').last);
      await tester.tap(find.text('Sign out').last);
      await tester.pumpAndSettle();
      expect(auth.user, isNull);
      expect(find.text('Continue with Phone'), findsOneWidget);
    },
  );
  testWidgets(
    'restored complete identity resumes home; incomplete identity resumes enrollment; failure stays gated',
    (tester) async {
      final service = TestAccountService()..setUser('test-user');
      final auth = AuthController(service);
      addTearDown(auth.dispose);
      final repository = TestProfileRepository(complete: true)
        ..hasConsent = true;
      await tester.pumpWidget(
        CarbonLensApp(auth: auth, repository: repository),
      );
      await tester.pumpAndSettle();
      expect(find.text('Your Green Score'), findsOneWidget);
      expect(find.text('Complete your profile'), findsNothing);
      expect(repository.saves, 0);
      await tester.pumpWidget(const SizedBox.shrink());
      repository.complete = false;
      await tester.pumpWidget(
        CarbonLensApp(auth: auth, repository: repository),
      );
      await tester.pumpAndSettle();
      expect(find.text('Complete your profile'), findsOneWidget);
      await tester.pumpWidget(const SizedBox.shrink());
      repository.loadFailure = const ApiFailure(
        'OFFLINE',
        'Profile unavailable.',
      );
      await tester.pumpWidget(
        CarbonLensApp(auth: auth, repository: repository),
      );
      await tester.pumpAndSettle();
      expect(find.text('Profile unavailable.'), findsOneWidget);
      expect(find.text('Your Green Score'), findsNothing);
    },
  );
  testWidgets(
    'phone screens require consent and OTP confirmation; errors and back preserve safe state',
    (tester) async {
      mobile(tester);
      await fonts(tester);
      final service = TestAccountService();
      addTearDown(service.dispose);
      final key = GlobalKey();
      await tester.pumpWidget(
        RepaintBoundary(
          key: key,
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: carbonLensTheme(),
            home: PhoneScreen(service: service),
          ),
        ),
      );
      await capture(tester, key, 'auth-phone-entry');
      expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('phone-submit')))
            .onPressed,
        isNull,
      );
      await tester.enterText(
        find.byKey(const Key('phone-number')),
        '9876543210',
      );
      await tester.tap(find.byType(CheckboxListTile));
      await tester.pump();
      await tester.tap(find.byKey(const Key('phone-submit')));
      await tester.pump();
      service.sent!(const PhoneChallenge('test-only-challenge', 7));
      await capture(tester, key, 'auth-phone-otp');
      expect(find.text('Verify your number'), findsOneWidget);
      expect(service.currentUser, isNull);
      service.confirmFailure = const AuthFailure(
        'invalid-verification-code',
        'Incorrect test code.',
      );
      await tester.enterText(find.byKey(const Key('otp-code')), '123456');
      await tester.tap(find.byKey(const Key('phone-submit')));
      await tester.pumpAndSettle();
      expect(find.text('Incorrect test code.'), findsOneWidget);
      expect(service.currentUser, isNull);
      await tester.tap(find.text('Change number'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('phone-number')), findsOneWidget);
      expect(find.byKey(const Key('otp-code')), findsNothing);
      expect(service.cancels, 1);
      await tester.pumpWidget(const SizedBox.shrink());
    },
  );
  testWidgets(
    'phone credential success returns to enrollment and Google cancellation stays signed out',
    (tester) async {
      mobile(tester);
      final service = TestAccountService();
      final auth = AuthController(service);
      addTearDown(auth.dispose);
      final repository = TestProfileRepository();
      await tester.pumpWidget(
        CarbonLensApp(auth: auth, repository: repository),
      );
      service.failure = const AuthFailure('cancelled', 'Cancelled.');
      expect(await auth.signInWithGoogle(), isFalse);
      expect(auth.error, isNull);
      expect(auth.user, isNull);
      service.failure = null;
      await tester.tap(find.text('Continue with Phone'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('phone-number')),
        '9876543210',
      );
      await tester.tap(find.byType(CheckboxListTile));
      await tester.pump();
      await tester.tap(find.byKey(const Key('phone-submit')));
      await tester.pump();
      service.sent!(const PhoneChallenge('test-only-challenge', null));
      await tester.pump();
      await tester.enterText(find.byKey(const Key('otp-code')), '123456');
      await tester.tap(find.byKey(const Key('phone-submit')));
      await tester.pumpAndSettle();
      expect(find.text('Complete your profile'), findsOneWidget);
      expect(find.byKey(const Key('otp-code')), findsNothing);
      expect(auth.user?.uid, 'test-user');
      expect(repository.saves, 0);
    },
  );
}
