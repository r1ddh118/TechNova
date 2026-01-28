import re
from collections import Counter


def count_digits(text: str) -> int:
    return sum(c.isdigit() for c in text)


def token_stats(tokens):
    return {
        "token_count": len(tokens),
        "unique_tokens": len(set(tokens)),
        "top_tokens": Counter(tokens).most_common(5),
    }
