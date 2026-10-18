import 'package:flutter/material.dart';
import 'dart:typed_data';
import 'package:firebase_app_check/firebase_app_check.dart';
import '../../core/storage/capture.dart';
import '../../core/storage/evidence_upload.dart';
import '../../core/api/api_client.dart';
import '../../app/widgets/green_widgets.dart';
import '../../app/widgets/page_shell.dart';
import '../../core/api/carbonlens_repository.dart';
import '../../core/api/api_errors.dart';
import '../../core/api/demo_repository.dart';
import '../../core/auth/auth_controller.dart';
import 'scan_result_screen.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({
    super.key,
    required this.repository,
    required this.auth,
    required this.open,
    this.storageBucket = '',
    this.onScan,
  });
  final CarbonLensRepository repository;
  final AuthController auth;
  final ValueChanged<String> open;
  final String storageBucket;
  final ValueChanged<String>? onScan;
  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final evidence = TextEditingController();
  final form = GlobalKey<FormState>();
  int mode = 0;
  String key = operationKey();
  String capturedAt = DateTime.now().toUtc().toIso8601String();
  Uint8List? photo;
  String photoType = 'image/jpeg';
  bool processing = false;
  String? error;
  Map<String, dynamic>? result;
  Map<String, dynamic>? pendingProduct;
  final productScans = <String, String>{};
  Future<void> choosePhoto(bool camera) async {
    if (widget.auth.consent?.camera != true) {
      setState(
        () => error =
            'Enable camera consent in Settings before selecting scan evidence.',
      );
      return;
    }
    setState(() {
      processing = true;
      error = null;
    });
    try {
      final selected = await pickImage(camera: camera);
      if (selected != null && mounted)
        setState(() {
          photo = selected.$1;
          photoType = selected.$2;
          evidence.clear();
          key = operationKey();
          capturedAt = DateTime.now().toUtc().toIso8601String();
        });
    } on ApiFailure catch (failure) {
      if (mounted) setState(() => error = failure.message);
    } finally {
      if (mounted) setState(() => processing = false);
    }
  }

  @override
  void dispose() {
    evidence.dispose();
    super.dispose();
  }

  Future<void> scan() async {
    if (!form.currentState!.validate()) return;
    if (widget.auth.consent?.camera != true) {
      setState(
        () => error =
            'Enable camera consent in Privacy & Settings before processing scan evidence.',
      );
      return;
    }
    setState(() {
      processing = true;
      error = null;
    });
    try {
      if (photo != null) {
        final uid = widget.auth.user!.uid;
        final uploader = EvidenceUploader(
          widget.storageBucket,
          ApiCredentials(
            widget.auth.service,
            appCheckToken: () => FirebaseAppCheck.instance.getToken(),
          ),
        );
        evidence.text = await uploader.upload(uid, key, photo!, photoType);
        if (!mounted) return;
        photo = null;
      }
      final response = await widget.repository.mutate('/v1/scans', {
        'mode': mode == 0 ? 'PRODUCT' : 'RECEIPT',
        'storage_object': evidence.text.trim(),
        'client_time': capturedAt,
      }, key);
      if (mounted) {
        widget.onScan?.call(response['scan_id'] as String);
        setState(() {
          if (mode == 0)
            productScans[response['product_candidate']['product_ref']
                    as String] =
                response['scan_id'] as String;
          result = mode == 1 && pendingProduct != null
              ? {...pendingProduct!, 'receipt_scan_id': response['scan_id']}
              : {
                  ...response,
                  'baseline_scans': Map<String, String>.from(productScans),
                };
          pendingProduct = null;
        });
      }
    } on ApiFailure catch (failure) {
      if (mounted) setState(() => error = failure.message);
    } finally {
      if (mounted) setState(() => processing = false);
    }
  }

  void sample() => setState(
    () => result = {
      'scan_id': 'illustration-only',
      'status': 'COMPLETED',
      'product_candidate': DemoRepository.products.first,
      'carbon': {
        'estimated_kg_co2e': .12,
        'avoided_kg_co2e': null,
        'method': 'illustration_only',
        'lifecycle_boundary': 'Reference illustration, not a sourced estimate',
        'factor_id': 'none',
        'factor_set_version': 'illustration-only',
        'confidence_grade': 'Not assessed',
        'source_name': 'Supplied UI reference',
      },
      'sustainability': {
        'score': 84,
        'score_policy_version': 'illustration-only',
        'dimensions': {
          'carbon_intensity': 80,
          'reusability': 85,
          'packaging': 90,
          'recyclability': 80,
          'durability': 90,
        },
      },
    },
  );
  @override
  Widget build(BuildContext context) {
    if (result != null)
      return ScanResultScreen(
        repository: widget.repository,
        result: result!,
        open: widget.open,
        receiptScan: () => setState(() {
          pendingProduct = result;
          result = null;
          mode = 1;
          evidence.clear();
          photo = null;
          key = operationKey();
          capturedAt = DateTime.now().toUtc().toIso8601String();
        }),
        back: () => setState(() {
          result = null;
          pendingProduct = null;
          evidence.clear();
          photo = null;
          key = operationKey();
        }),
      );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ChoiceTabs(
          labels: const ['Product', 'Receipt'],
          selected: mode,
          onChanged: processing
              ? (_) {}
              : (v) => setState(() {
                  mode = v;
                  pendingProduct = null;
                  evidence.clear();
                  photo = null;
                  key = operationKey();
                }),
        ),
        const SizedBox(height: 16),
        Container(
          height: 340,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              colors: [Color(0xff173a30), Color(0xff081c18)],
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 190,
                height: 260,
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xff69d8a8), width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: photo != null
                      ? Image.memory(photo!, fit: BoxFit.contain)
                      : mode == 0
                      ? const ProductArt(size: 145)
                      : const Icon(
                          Icons.receipt_long,
                          color: Colors.white70,
                          size: 100,
                        ),
                ),
              ),
              Positioned(
                top: 18,
                child: Text(
                  mode == 0 ? 'Scan Product' : 'Scan Receipt',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Positioned(
                bottom: 16,
                child: Text(
                  'Evidence preview',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (widget.repository.isDemo) ...[
          const Text(
            'Explore the supplied bamboo toothbrush example. This does not identify an image or calculate a real footprint.',
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            key: const Key('sample-scan'),
            onPressed: sample,
            icon: const Icon(Icons.document_scanner),
            label: const Text('Explore sample result'),
          ),
        ] else ...[
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: processing ? null : () => choosePhoto(false),
                  icon: const Icon(Icons.photo_library_outlined),
                  label: const Text('Photos'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: processing ? null : () => choosePhoto(true),
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: const Text('Camera'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Your selected image is uploaded privately for analysis. Choose a full-resolution photo for receipt OCR.',
          ),
          const SizedBox(height: 14),
          Form(
            key: form,
            child: TextFormField(
              controller: evidence,
              enabled: !processing,
              decoration: const InputDecoration(
                labelText: 'Private evidence reference',
                helperText: 'Use evidence belonging to your account',
              ),
              onChanged: (_) {
                key = operationKey();
                capturedAt = DateTime.now().toUtc().toIso8601String();
              },
              validator: (v) => (v == null || v.trim().isEmpty) && photo == null
                  ? 'Choose evidence to analyze.'
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: processing ? null : scan,
            icon: const Icon(Icons.document_scanner),
            label: Text(
              processing ? 'Processing evidence…' : 'Analyze evidence',
            ),
          ),
        ],
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 14),
            child: MessageBox(message: error!, isError: true),
          ),
        TextButton(
          onPressed: () => widget.open('Settings'),
          child: const Text('Manage camera consent'),
        ),
      ],
    );
  }
}
