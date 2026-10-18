class ApiFailure implements Exception {
  const ApiFailure(
    this.code,
    this.message, {
    this.retryable = false,
    this.status = 0,
  });
  final String code;
  final String message;
  final bool retryable;
  final int status;
}
