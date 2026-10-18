class SustainabilityScore {
  SustainabilityScore.fromJson(Map<String, dynamic> json)
    : score = json['score'] as int,
      dimensions = Map<String, num>.from(json['dimensions'] as Map),
      version = json['score_policy_version'] as String {
    if (score < 0 ||
        score > 100 ||
        dimensions.values.any((v) => !v.isFinite || v < 0 || v > 100)) {
      throw const FormatException('Invalid sustainability score');
    }
  }
  final int score;
  final Map<String, num> dimensions;
  final String version;
}
