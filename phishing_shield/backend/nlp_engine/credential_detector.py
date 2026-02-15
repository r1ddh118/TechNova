CREDENTIAL_KEYWORDS = [
    "password",
    "passcode",
    "otp",
    "one time password",
    "bank pin",
    "pin code",
    "cvv",
    "security code",
    "verification code",
    "login code",
    "account number",
]


def credential_request_score(text: str) -> int:
    """Count credential-request indicators in text."""
    if not isinstance(text, str):
        text = str(text)

    lowered = text.lower()
    score = 0
    for keyword in CREDENTIAL_KEYWORDS:
        if keyword in lowered:
            score += 1
    return score
