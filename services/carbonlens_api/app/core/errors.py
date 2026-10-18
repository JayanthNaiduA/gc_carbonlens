"""Public errors never contain raw evidence, tokens or upstream responses."""


class DomainError(Exception):
    def __init__(self, code, message, status=400, retryable=False):
        super().__init__(message)
        self.code, self.message = code, message
        self.status, self.retryable = status, retryable

    def envelope(self, request_id):
        return {"error": {"code": self.code, "message": self.message,
                          "request_id": request_id, "retryable": self.retryable}}


def require(condition, code, message, status=400):
    if not condition:
        raise DomainError(code, message, status)


def number(value, name, minimum=0, maximum=1e9):
    import math
    require(isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and minimum <= value <= maximum,
            "INVALID_INPUT", f"{name} is outside the supported range.")
    return value
