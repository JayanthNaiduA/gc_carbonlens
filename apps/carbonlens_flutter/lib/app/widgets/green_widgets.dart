import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/api/resource_controller.dart';
import 'page_shell.dart';

const green = Color(0xff008b5b);
const ink = Color(0xff10243b);
const mint = Color(0xffe4f7eb);

class GreenCard extends StatelessWidget {
  const GreenCard({
    super.key,
    required this.child,
    this.color = Colors.white,
    this.padding = 18,
  });
  final Widget child;
  final Color color;
  final double padding;
  @override
  Widget build(BuildContext context) => Card(
    color: color,
    child: Padding(padding: EdgeInsets.all(padding), child: child),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.action});
  final String title;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleMedium),
        ),
        if (action != null) action!,
      ],
    ),
  );
}

class ChoiceTabs extends StatelessWidget {
  const ChoiceTabs({
    super.key,
    required this.labels,
    required this.selected,
    required this.onChanged,
  });
  final List<String> labels;
  final int selected;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) => Row(
    children: List.generate(
      labels.length,
      (i) => Expanded(
        child: Padding(
          padding: EdgeInsets.only(right: i == labels.length - 1 ? 0 : 6),
          child: Semantics(
            selected: selected == i,
            child: TextButton(
              style: TextButton.styleFrom(
                backgroundColor: selected == i
                    ? green
                    : const Color(0xffeef4f5),
                foregroundColor: selected == i ? Colors.white : ink,
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 4,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: () => onChanged(i),
              child: Text(labels[i], textAlign: TextAlign.center),
            ),
          ),
        ),
      ),
    ),
  );
}

class MetricRow extends StatelessWidget {
  const MetricRow(
    this.icon,
    this.label,
    this.value, {
    super.key,
    this.highlight = false,
  });
  final IconData icon;
  final String label, value;
  final bool highlight;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10),
    child: Row(
      children: [
        Icon(icon, size: 20, color: green),
        const SizedBox(width: 12),
        Expanded(child: Text(label)),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: highlight ? green : ink,
            ),
          ),
        ),
      ],
    ),
  );
}

class ResourceView extends StatefulWidget {
  const ResourceView({
    super.key,
    required this.repository,
    required this.path,
    required this.builder,
  });
  final CarbonLensRepository repository;
  final String path;
  final Widget Function(Map<String, dynamic>) builder;
  @override
  State<ResourceView> createState() => _ResourceViewState();
}

class _ResourceViewState extends State<ResourceView> {
  late final ResourceController controller = ResourceController(
    widget.repository,
  );
  @override
  void initState() {
    super.initState();
    controller.load(widget.path);
  }

  @override
  void didUpdateWidget(ResourceView old) {
    super.didUpdateWidget(old);
    if (widget.path != old.path) controller.load(widget.path);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (context, _) {
      if (controller.loading)
        return const Padding(
          padding: EdgeInsets.all(48),
          child: Center(child: CircularProgressIndicator()),
        );
      if (controller.error != null)
        return Column(
          children: [
            MessageBox(message: controller.error!.message, isError: true),
            OutlinedButton.icon(
              onPressed: () => controller.load(widget.path),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        );
      if (controller.data == null) return const Text('Nothing to show yet.');
      return widget.builder(controller.data!);
    },
  );
}

class Landscape extends StatelessWidget {
  const Landscape({super.key, this.height = 200});
  final double height;
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Illustrated green mountain landscape',
    child: SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(painter: _LandscapePainter()),
    ),
  );
}

class _LandscapePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xffe3f2f4), Color(0xffc2ded2)],
        ).createShader(Offset.zero & size),
    );
    for (var layer = 0; layer < 4; layer++) {
      final path = Path()..moveTo(0, size.height);
      for (var x = 0.0; x <= size.width + 8; x += 8) {
        final y =
            size.height * (.38 + layer * .14) +
            math.sin(x / (40 + layer * 10) + layer * 2) * size.height * .11;
        path.lineTo(x, y);
      }
      path.lineTo(size.width, size.height);
      path.close();
      canvas.drawPath(
        path,
        Paint()
          ..color = [
            const Color(0xff8fafaa),
            const Color(0xff588f78),
            const Color(0xff226c51),
            const Color(0xff064c3a),
          ][layer],
      );
    }
    for (var i = 0; i < 24; i++) {
      final x = i * size.width / 23;
      final h = size.height * (.12 + (i % 4) * .025);
      final tree = Path()
        ..moveTo(x, size.height - h)
        ..lineTo(x - h * .35, size.height)
        ..lineTo(x + h * .35, size.height)
        ..close();
      canvas.drawPath(tree, Paint()..color = const Color(0xff003f30));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ProductArt extends StatelessWidget {
  const ProductArt({super.key, this.kind = 'brush', this.size = 88});
  final String kind;
  final double size;
  @override
  Widget build(BuildContext context) => Semantics(
    label: kind == 'brush'
        ? 'Bamboo toothbrush illustration'
        : 'Reusable product illustration',
    child: Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xfff0ebe5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: CustomPaint(painter: _ProductPainter(kind)),
    ),
  );
}

class _ProductPainter extends CustomPainter {
  _ProductPainter(this.kind);
  final String kind;
  @override
  void paint(Canvas c, Size s) {
    final center = s.width / 2;
    if (kind == 'brush') {
      c.save();
      c.translate(center, s.height / 2);
      c.rotate(.10);
      final wood = Paint()
        ..shader =
            const LinearGradient(
              colors: [Color(0xffbb8c52), Color(0xffead0a1), Color(0xffa87840)],
            ).createShader(
              Rect.fromLTWH(
                -s.width * .07,
                -s.height * .4,
                s.width * .14,
                s.height * .8,
              ),
            );
      c.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            -s.width * .07,
            -s.height * .4,
            s.width * .14,
            s.height * .8,
          ),
          Radius.circular(s.width * .06),
        ),
        wood,
      );
      for (var i = 0; i < 8; i++) {
        c.drawLine(
          Offset(-s.width * .04, -s.height * .34 + i * s.height * .025),
          Offset(s.width * .11, -s.height * .34 + i * s.height * .025),
          Paint()
            ..color = const Color(0xfffaf8eb)
            ..strokeWidth = s.height * .014,
        );
      }
      c.restore();
    } else {
      c.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            center - s.width * .14,
            s.height * .22,
            s.width * .28,
            s.height * .58,
          ),
          Radius.circular(s.width * .06),
        ),
        Paint()
          ..color = kind == 'floss'
              ? const Color(0xffe2cdae)
              : const Color(0xff446944),
      );
      c.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            center - s.width * .10,
            s.height * .13,
            s.width * .20,
            s.height * .12,
          ),
          const Radius.circular(3),
        ),
        Paint()..color = ink,
      );
      c.drawLine(
        Offset(center - s.width * .07, s.height * .3),
        Offset(center - s.width * .07, s.height * .7),
        Paint()
          ..color = Colors.white54
          ..strokeWidth = 3,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ProductPainter old) => old.kind != kind;
}

class TreeMascot extends StatelessWidget {
  const TreeMascot({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Friendly CarbonLens tree',
    child: SizedBox(
      width: 180,
      height: 170,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            bottom: 8,
            child: Container(
              width: 24,
              height: 65,
              decoration: BoxDecoration(
                color: const Color(0xffaa8142),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          ...List.generate(
            7,
            (i) => Positioned(
              left: 28 + (i % 3) * 32,
              top: 15 + (i ~/ 3) * 29,
              child: Container(
                width: 65,
                height: 65,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: [
                    const Color(0xff37ab56),
                    const Color(0xff6bc54d),
                    const Color(0xff229548),
                  ][i % 3],
                ),
              ),
            ),
          ),
          const Positioned(
            top: 70,
            child: Icon(
              Icons.sentiment_satisfied_alt,
              size: 48,
              color: Color(0xff133d2b),
            ),
          ),
          const Positioned(
            right: 0,
            top: 30,
            child: Icon(Icons.auto_awesome, color: Color(0xffffc33b)),
          ),
          const Positioned(
            left: 0,
            top: 90,
            child: Icon(Icons.auto_awesome, color: Color(0xffacd649), size: 20),
          ),
        ],
      ),
    ),
  );
}
