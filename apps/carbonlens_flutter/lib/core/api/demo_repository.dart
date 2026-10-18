import 'carbonlens_repository.dart';
import 'api_errors.dart';

/// Illustration fixtures only. This repository has no transport and cannot
/// credit rewards, upload evidence, or masquerade as a real Google integration.
class DemoRepository implements CarbonLensRepository {
  @override
  bool get isDemo => true;
  static const products = [
    {
      'product_ref': 'bamboo_toothbrush',
      'name': 'Bamboo Toothbrush',
      'brand': 'EcoSmile',
      'category': 'Personal Care',
      'footprint': .12,
      'lower': 72,
      'score': 84,
      'icon': 'brush',
    },
    {
      'product_ref': 'floss',
      'name': 'Biodegradable Floss',
      'brand': 'GreenCare',
      'category': 'Personal Care',
      'footprint': .08,
      'lower': 68,
      'score': 81,
      'icon': 'floss',
    },
    {
      'product_ref': 'bottle',
      'name': 'Refillable Bottle',
      'brand': 'AquaPure',
      'category': 'Home',
      'footprint': .15,
      'lower': 80,
      'score': 88,
      'icon': 'bottle',
    },
    {
      'product_ref': 'deodorant',
      'name': 'Natural Deodorant',
      'brand': 'EarthKind',
      'category': 'Personal Care',
      'footprint': .25,
      'lower': 60,
      'score': 76,
      'icon': 'bottle',
    },
  ];
  @override
  Future<Map<String, dynamic>> get(String path) async {
    if (path.startsWith('/v1/dashboard')) {
      final period = Uri.parse(path).queryParameters['period'] ?? 'today';
      return {
        'period': period,
        'green_score': 78,
        'walking_km': period == 'today'
            ? 3.8
            : period == 'week'
            ? 21.4
            : 76.2,
        'greener_purchases': period == 'today'
            ? 2
            : period == 'week'
            ? 7
            : 18,
        'avoided_kg_co2e': period == 'today'
            ? 1.4
            : period == 'week'
            ? 4.8
            : 12.4,
        'points_earned': period == 'today'
            ? 85
            : period == 'week'
            ? 320
            : 980,
        'wallet': {'available_points': 1420, 'provisional_points': 100},
        'insight':
            'You purchased packaged water three times this week. Switching to a reusable bottle could reduce repeated packaging waste.',
      };
    }
    if (path == '/v1/products') return {'products': products};
    if (path == '/v1/wallet')
      return {
        'available_points': 1420,
        'provisional_points': 100,
        'entries': [
          {
            'event_id': 'illustration-product',
            'points_delta': 50,
            'entry_type': 'VESTED',
            'policy_version': 'illustration-only',
            'created_at': '2026-10-09T10:00:00Z',
          },
          {
            'event_id': 'illustration-plot',
            'points_delta': 100,
            'entry_type': 'PROVISIONAL',
            'policy_version': 'illustration-only',
            'created_at': '2026-10-08T10:00:00Z',
          },
        ],
      };
    if (path == '/v1/reports/monthly')
      return {
        'avoided_kg_co2e': 12.4,
        'weekly_avoided': [1.4, 2.8, 3.6, 4.6],
        'categories': [
          {'name': 'Products', 'value': 5.2},
          {'name': 'Transport', 'value': 4.1},
          {'name': 'Recycling', 'value': 2.3},
          {'name': 'Trees', 'value': .8},
        ],
      };
    if (path == '/v1/grow-green/projects') return {'projects': []};
    throw const ApiFailure(
      'UNAVAILABLE',
      'This preview has no live data for this feature.',
    );
  }

  @override
  Future<Map<String, dynamic>> mutate(
    String path,
    Map<String, Object?> body,
    String key, {
    String method = 'POST',
  }) async {
    throw const ApiFailure(
      'DEMO_READ_ONLY',
      'This is a visual demo. Evidence is not uploaded and no real Green Points are issued.',
    );
  }
}
