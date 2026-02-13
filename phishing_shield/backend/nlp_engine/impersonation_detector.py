ORG_KEYWORDS = [
    "bank",
    "government",
    "admin",
    "support",
    "security team",
    "it department",
    "administrator",
    "compliance team",
    "fraud department",
    "billing team",
    "human resources",
    "payroll",
    "ceo",
    "cfo",
    "help desk",
    "customer care",
]


def impersonation_score(text: str) -> int:
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    score = 0
    for word in ORG_KEYWORDS:
        if word in text:
            score += 1
    return score
