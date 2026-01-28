URGENT_WORDS = [
    "urgent",
    "immediately",
    "verify now",
    "act fast",
    "account suspended",
    "limited time",
    "password expired",
    "asap",
    "verify your account",
]


def urgency_score(text: str) -> int:
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    score = 0
    for word in URGENT_WORDS:
        if word in text:
            score += 1
    return score
