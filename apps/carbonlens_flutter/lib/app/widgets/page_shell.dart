import 'package:flutter/material.dart';

class PageShell extends StatelessWidget {
  const PageShell({super.key, required this.child, this.maxWidth = 520});
  final Widget child;
  final double maxWidth;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xffe3f3e9), Color(0xfff8fbf9), Color(0xffeef4ef)],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxWidth),
              child: child,
            ),
          ),
        ),
      ),
    ),
  );
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.compact = false});
  final bool compact;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      Container(
        padding: EdgeInsets.all(compact ? 10 : 20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Icon(
          Icons.eco_outlined,
          size: compact ? 28 : 52,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
      const SizedBox(height: 16),
      Text(
        'CarbonLens',
        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
          fontWeight: FontWeight.w800,
          fontSize: compact ? 20 : 30,
        ),
      ),
      if (!compact) const SizedBox(height: 8),
      if (!compact)
        const Text(
          'See your impact. Choose greener. Earn for change.',
          textAlign: TextAlign.center,
        ),
    ],
  );
}

class MessageBox extends StatelessWidget {
  const MessageBox({super.key, required this.message, this.isError = false});
  final String message;
  final bool isError;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isError ? scheme.errorContainer : scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        message,
        style: TextStyle(
          color: isError
              ? scheme.onErrorContainer
              : scheme.onSecondaryContainer,
        ),
      ),
    );
  }
}
