class VerificationDecision {
  VerificationDecision.fromJson(Map<String, dynamic> json)
    : level = json['level'] as String,
      reasons = List<String>.from(json['reason_codes'] as List) {
    if (!['V0', 'V1', 'V2', 'V3'].contains(level))
      throw const FormatException('Invalid verification level');
  }
  final String level;
  final List<String> reasons;
}
