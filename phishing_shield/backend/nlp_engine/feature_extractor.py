from typing import Any, Dict, Union

from .credential_detector import CREDENTIAL_KEYWORDS
from .impersonation_detector import ORG_KEYWORDS
from .preprocess import clean_text, combine_subject_body, extract_email_addresses, extract_urls
from .url_analyzer import analyze_urls
from .urgency_detector import URGENT_WORDS

EXPLAINABILITY_MAP = {
    "url_count": "Email contains URLs, which can redirect to malicious websites.",
    "suspicious_url_score": "URLs include risky patterns (long, numeric, hyphenated, shorteners, IP-based or lookalike domains).",
    "ip_url_count": "At least one URL directly uses an IP address instead of a trusted domain.",
    "shortener_url_count": "URL shortener detected, which can hide the real destination.",
    "suspicious_subdomain_count": "Potentially deceptive subdomain terms detected (e.g., login/secure/verify).",
    "lookalike_domain_count": "Potential typosquatted or lookalike brand domain detected (e.g., paypa1).",
    "urgency_score": "Urgency language found that pressures quick action.",
    "impersonation_score": "Impersonation-like sender/organization cues detected.",
    "credential_request_score": "Possible credential-harvesting request detected (password/OTP/PIN/CVV).",
    "digit_count": "High digit usage can indicate codes, account numbers, or obfuscation.",
}


def _build_explanations(features: Dict[str, Any]):
    reasons = []
    for key, message in EXPLAINABILITY_MAP.items():
        if features.get(key, 0) > 0:
            reasons.append(
                {
                    "feature": key,
                    "value": features.get(key),
                    "reason": message,
                }
            )
    return reasons


def _build_line_highlights(text: str) -> list[Dict[str, Any]]:
    if not text:
        return []

    lines = [line.strip() for line in str(text).splitlines() if line.strip()]
    if not lines:
        lines = [str(text).strip()]

    highlights = []
    for idx, line in enumerate(lines, start=1):
        lowered = line.lower()
        triggers = []

        if "http://" in lowered or "https://" in lowered:
            triggers.append("url")

        urgency_hits = [token for token in URGENT_WORDS if token in lowered]
        impersonation_hits = [token for token in ORG_KEYWORDS if token in lowered]
        credential_hits = [token for token in CREDENTIAL_KEYWORDS if token in lowered]

        if urgency_hits:
            triggers.append("urgency")
        if impersonation_hits:
            triggers.append("impersonation")
        if credential_hits:
            triggers.append("credential_request")

        if triggers:
            highlights.append(
                {
                    "line_number": idx,
                    "line_text": line,
                    "triggers": sorted(set(triggers)),
                    "matched_terms": {
                        "urgency": sorted(set(urgency_hits)),
                        "impersonation": sorted(set(impersonation_hits)),
                        "credential": sorted(set(credential_hits)),
                    },
                }
            )

    return highlights


def extract_features(record: Union[str, Dict[str, Any]]):
    """Extract explainable security features from text or structured email record.

    record can be a plain string (treated as body) or a dict-like with keys
    'subject', 'body', 'sender', 'recipient', 'timestamp', 'attachments'.

    Returns a dictionary of named features.
    """
    if isinstance(record, str):
        raw_text = str(record)
        text = clean_text(record)
        subject = None
        sender = None
        recipient = None
    else:
        subject = record.get("subject") if hasattr(record, "get") else record.get("Subject")
        body = record.get("body") if hasattr(record, "get") else record.get("Body")
        sender = record.get("sender") if hasattr(record, "get") else record.get("From")
        recipient = record.get("recipient") if hasattr(record, "get") else record.get("To")
        raw_text = f"{subject or ''}\n{body or ''}".strip()
        text = combine_subject_body(subject, body)

    urls = extract_urls(text)
    url_count = len(urls)

    url_details = (
        analyze_urls(text)
        if url_count
        else {
            "url_count": 0,
            "suspicious_score": 0,
            "ip_url_count": 0,
            "shortener_url_count": 0,
            "suspicious_subdomain_count": 0,
            "lookalike_domain_count": 0,
        }
    )

    suspicious_url_score = url_details.get("suspicious_score", 0)

    urgency = sum(1 for token in URGENT_WORDS if token in text.lower())
    impersonation = sum(1 for token in ORG_KEYWORDS if token in text.lower())
    credential_score = sum(1 for token in CREDENTIAL_KEYWORDS if token in text.lower())
    digit_count = sum(c.isdigit() for c in text)
    length = len(text)
    email_addresses = extract_email_addresses(text)

    features = {
        "text": text,
        "subject": subject,
        "sender": sender,
        "recipient": recipient,
        "url_count": url_count,
        "suspicious_url_score": suspicious_url_score,
        "ip_url_count": url_details.get("ip_url_count", 0),
        "shortener_url_count": url_details.get("shortener_url_count", 0),
        "suspicious_subdomain_count": url_details.get("suspicious_subdomain_count", 0),
        "lookalike_domain_count": url_details.get("lookalike_domain_count", 0),
        "urgency_score": urgency,
        "impersonation_score": impersonation,
        "credential_request_score": credential_score,
        "digit_count": digit_count,
        "length": length,
        "email_addresses": email_addresses,
    }
    features["explanations"] = _build_explanations(features)
    features["line_highlights"] = _build_line_highlights(raw_text if raw_text else text)
    return features


def to_vector(features: dict):
    """Convert named features into a numeric vector for classic ML (order consistent)."""
    return [
        features.get("url_count", 0),
        features.get("suspicious_url_score", 0),
        features.get("ip_url_count", 0),
        features.get("shortener_url_count", 0),
        features.get("suspicious_subdomain_count", 0),
        features.get("lookalike_domain_count", 0),
        features.get("urgency_score", 0),
        features.get("impersonation_score", 0),
        features.get("credential_request_score", 0),
        features.get("digit_count", 0),
        features.get("length", 0),
        features.get("text_length", features.get("length", 0)),
    ]
