class LedgerEntry {
  LedgerEntry.fromJson(Map<String, dynamic> json)
    : eventId = json['event_id'] as String,
      points = json['points_delta'] as int,
      type = json['entry_type'] as String,
      policyVersion = json['policy_version'] as String,
      createdAt = DateTime.parse(json['created_at'] as String);
  final String eventId, type, policyVersion;
  final int points;
  final DateTime createdAt;
}
