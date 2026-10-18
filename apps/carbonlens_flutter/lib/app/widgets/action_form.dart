import 'package:flutter/material.dart';
import '../../core/api/api_errors.dart';
import '../../core/api/carbonlens_repository.dart';
import 'page_shell.dart';

class EvidenceForm extends StatefulWidget {
  const EvidenceForm({
    super.key,
    required this.repository,
    required this.path,
    required this.fields,
    required this.body,
    required this.label,
    this.guard,
    this.success,
  });
  final CarbonLensRepository repository;
  final String path, label;
  final Map<String, String> fields;
  final Map<String, Object?> Function(Map<String, String>) body;
  final String? Function()? guard;
  final String Function(Map<String, dynamic>)? success;
  @override
  State<EvidenceForm> createState() => _EvidenceFormState();
}

class _EvidenceFormState extends State<EvidenceForm> {
  final form = GlobalKey<FormState>();
  late final controllers = {
    for (final key in widget.fields.keys) key: TextEditingController(),
  };
  String key = operationKey();
  Map<String, Object?>? submittedBody;
  bool busy = false;
  String? message;
  bool failed = false;
  @override
  void dispose() {
    for (final c in controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    final blocked = widget.guard?.call();
    if (blocked != null) {
      setState(() {
        message = blocked;
        failed = true;
      });
      return;
    }
    setState(() {
      busy = true;
      message = null;
      failed = false;
    });
    try {
      submittedBody ??= widget.body(
        controllers.map((k, v) => MapEntry(k, v.text.trim())),
      );
      final response = await widget.repository.mutate(
        widget.path,
        submittedBody!,
        key,
      );
      if (mounted)
        setState(
          () => message =
              widget.success?.call(response) ??
              'Submitted. Status: ${response['state'] ?? response['status'] ?? 'PENDING'}',
        );
    } on ApiFailure catch (failure) {
      if (mounted)
        setState(() {
          message = failure.message;
          failed = true;
        });
    } on FormatException {
      if (mounted)
        setState(() {
          message = 'Enter valid numbers in numeric fields.';
          failed = true;
        });
    } catch (_) {
      if (mounted)
        setState(() {
          message = 'This action could not finish. Please retry.';
          failed = true;
        });
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final entry in widget.fields.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: TextFormField(
              controller: controllers[entry.key],
              enabled: !busy,
              decoration: InputDecoration(labelText: entry.value),
              onChanged: (_) {
                key = operationKey();
                submittedBody = null;
                message = null;
              },
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Enter ${entry.value.toLowerCase()}.'
                  : null,
            ),
          ),
        if (message != null) MessageBox(message: message!, isError: failed),
        FilledButton(
          onPressed: busy ? null : submit,
          child: Text(busy ? 'Submitting…' : widget.label),
        ),
      ],
    ),
  );
}
