import 'verification_decision.dart';

class GreenEvent {
  GreenEvent.fromJson(Map<String, dynamic> json)
    : id = json['event_id'] as String,
      action = json['action_type'] as String,
      state = json['reward_state'] as String,
      verification = VerificationDecision.fromJson(
        Map<String, dynamic>.from(json['verification'] as Map),
      );
  final String id, action, state;
  final VerificationDecision verification;
}
