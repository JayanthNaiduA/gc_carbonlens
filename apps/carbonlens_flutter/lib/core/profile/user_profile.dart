class UserProfile {
  UserProfile.fromJson(Map<String, dynamic> json)
    : uid = json['uid'] as String,
      name = json['display_name'] as String? ?? '',
      region = json['region'] as String? ?? '',
      complete = json['profile_complete'] == true,
      version = json['version'] as int? ?? 0,
      email = json['email'] as String?,
      phone = json['phone_number'] as String?,
      photoUrl = json['photo_url'] as String?,
      providers = List<String>.from(json['providers'] as List? ?? []);
  final String uid, name, region;
  final String? email, phone, photoUrl;
  final List<String> providers;
  final bool complete;
  final int version;
}
