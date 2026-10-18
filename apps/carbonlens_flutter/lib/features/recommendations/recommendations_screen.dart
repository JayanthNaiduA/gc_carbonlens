import 'package:flutter/material.dart';
import '../../app/widgets/green_widgets.dart';
import '../../core/api/carbonlens_repository.dart';

class RecommendationsScreen extends StatefulWidget {
  const RecommendationsScreen({
    super.key,
    required this.repository,
    required this.open,
  });
  final CarbonLensRepository repository;
  final ValueChanged<String> open;
  @override
  State<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends State<RecommendationsScreen> {
  int selected = 0;
  static const categories = ['All', 'Personal Care', 'Home', 'Food'];
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      ChoiceTabs(
        labels: categories,
        selected: selected,
        onChanged: (v) => setState(() => selected = v),
      ),
      const SizedBox(height: 18),
      ResourceView(
        repository: widget.repository,
        path: '/v1/products',
        builder: (data) {
          final products = (data['products'] as List? ?? []).cast<Map>();
          final filtered = products
              .where(
                (p) => selected == 0 || p['category'] == categories[selected],
              )
              .toList();
          if (filtered.isEmpty)
            return const GreenCard(
              child: Text(
                'No sourced alternatives in this category yet. Try another category.',
              ),
            );
          return Column(
            children: [
              for (final product in filtered)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GreenCard(
                    padding: 12,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => showDialog<void>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: Text(product['name']?.toString() ?? 'Product'),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ProductArt(
                                kind: product['icon']?.toString() ?? 'brush',
                                size: 150,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                product['description']?.toString() ??
                                    'Compare durability, material and end-of-life options for this product.',
                              ),
                              if (widget.repository.isDemo)
                                const Text(
                                  'Illustrative catalog; figures are not sourced estimates.',
                                ),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Close'),
                            ),
                          ],
                        ),
                      ),
                      child: Row(
                        children: [
                          ProductArt(
                            kind: product['icon']?.toString() ?? 'brush',
                            size: 78,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product['name']?.toString() ?? 'Product',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(product['brand']?.toString() ?? ''),
                                const SizedBox(height: 8),
                                Text(
                                  product['footprint'] == null
                                      ? 'Sourced footprint not available'
                                      : '${product['footprint']} kg CO2e',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                if (product['lower'] != null)
                                  Text(
                                    '${product['lower']}% lower · illustrative',
                                    style: const TextStyle(
                                      color: green,
                                      fontSize: 12,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: green),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
      SectionTitle('Choose a greener action'),
      FilledButton.icon(
        onPressed: () => widget.open('Scan'),
        icon: const Icon(Icons.document_scanner_outlined),
        label: const Text('Scan and compare a product'),
      ),
      const SizedBox(height: 12),
      const Text(
        'Partner shopping and checkout require configured merchant contracts. Green Points are loyalty units, not carbon credits.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}
