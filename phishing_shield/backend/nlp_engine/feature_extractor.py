from .preprocess import clean_text
from .url_analyzer import url_features
from .urgency_detector import urgency_score
from .impersonation_detector import impersonation_score


def extract_features(text: str):
    text = clean_text(text)

    url_count, suspicious_url_score = url_features(text)
    urgency = urgency_score(text)
    impersonation = impersonation_score(text)
    length = len(text)

    # Return as simple numeric list for classic ML
    return [
        url_count,
        suspicious_url_score,
        urgency,
        impersonation,
        length,
    ]
