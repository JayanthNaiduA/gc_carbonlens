class RewardDecision {
  RewardDecision.fromJson(Map<String, dynamic> json)
    : eventId = json['event_id'] as String,
      state = json['state'] as String,
      points = json['points'] as int,
      policyVersion = json['policy_version'] as String,
      eligible = json['eligible'] as bool;
  final String eventId, state, policyVersion;
  final int points;
  final bool eligible;
}
