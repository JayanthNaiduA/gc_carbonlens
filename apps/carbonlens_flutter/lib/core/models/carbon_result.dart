class CarbonResult {
  CarbonResult.fromJson(Map<String, dynamic> json)
    : estimated = (json['estimated_kg_co2e'] as num).toDouble(),
      avoided = (json['avoided_kg_co2e'] as num?)?.toDouble(),
      method = json['method'] as String,
      boundary = json['lifecycle_boundary'] as String,
      factorVersion = json['factor_set_version'] as String,
      confidence = json['confidence_grade'] as String,
      source = json['source_name'] as String;
  final double estimated;
  final double? avoided;
  final String method, boundary, factorVersion, confidence, source;
}
