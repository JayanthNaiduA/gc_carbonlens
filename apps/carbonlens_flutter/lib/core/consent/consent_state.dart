class ConsentState {
  factory ConsentState.fromJson(Map<String, dynamic> value) => ConsentState(
    camera: value['camera'] == true,
    location: value['location'] == true,
    healthConnect: value['health_connect'] == true,
    microphone: value['microphone'] == true,
    personalization: value['personalization'] == true,
    policyVersion: value['policy_version'] as String,
    acceptedAt: DateTime.tryParse(value['updated_at']?.toString() ?? ''),
  );
  const ConsentState({
    this.camera = false,
    this.location = false,
    this.healthConnect = false,
    this.personalization = false,
    this.microphone = false,
    this.acceptedAt,
    this.policyVersion = 'prototype-consent-v1',
  });
  final bool camera;
  final bool location;
  final bool healthConnect;
  final bool personalization;
  final bool microphone;
  final DateTime? acceptedAt;
  final String policyVersion;

  ConsentState acceptedNow() => ConsentState(
    camera: camera,
    location: location,
    healthConnect: healthConnect,
    personalization: personalization,
    microphone: microphone,
    policyVersion: policyVersion,
    acceptedAt: DateTime.now().toUtc(),
  );

  /// Future PUT /v1/consents payload. UID comes from the server token, not this map.
  Map<String, Object?> toJson() => {
    'policy_version': policyVersion,
    'camera': camera,
    'location': location,
    'health_connect': healthConnect,
    'personalization': personalization,
    'microphone': microphone,
    'accepted_at': acceptedAt?.toIso8601String(),
  };
}
