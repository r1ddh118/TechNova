from backend.nlp_engine.preprocess import clean_text, extract_urls, extract_email_addresses, combine_subject_body
from backend.nlp_engine.url_analyzer import url_features
from backend.nlp_engine.urgency_detector import urgency_score
from backend.nlp_engine.impersonation_detector import impersonation_score
from typing import Union, Dict, Any


def extract_features(record: Union[str, Dict[str, Any]]):
    """Extract explainable security features from text or structured email record.

    record can be a plain string (treated as body) or a dict-like with keys
    'subject', 'body', 'sender', 'recipient', 'timestamp', 'attachments'.

    Returns a dictionary of named features.
    """
    # support plain string input
    if isinstance(record, str):
        text = clean_text(record)
        subject = None
        sender = None
        recipient = None
    else:
        subject = record.get('subject') if hasattr(record, 'get') else record.get('Subject')
        body = record.get('body') if hasattr(record, 'get') else record.get('Body')
        sender = record.get('sender') if hasattr(record, 'get') else record.get('From')
        recipient = record.get('recipient') if hasattr(record, 'get') else record.get('To')
        text = combine_subject_body(subject, body)

    urls = extract_urls(text)
    url_count = len(urls)

    # overall suspicious score from url heuristics applied to combined text
    suspicious_url_score = 0
    if url_count:
        _, suspicious_url_score = url_features(text)

    urgency = urgency_score(text)
    impersonation = impersonation_score(text)
    digit_count = sum(c.isdigit() for c in text)
    length = len(text)
    email_addresses = extract_email_addresses(text)

    return {
        'text': text,
        'subject': subject,
        'sender': sender,
        'recipient': recipient,
        'url_count': url_count,
        'suspicious_url_score': suspicious_url_score,
        'urgency_score': urgency,
        'impersonation_score': impersonation,
        'digit_count': digit_count,
        'length': length,
        'email_addresses': email_addresses,
    }


def to_vector(features: dict):
    """Convert named features into a numeric vector for classic ML (order consistent).

    Order: [url_count, suspicious_url_score, urgency_score, impersonation_score, digit_count, length]
    """
    return [
        features.get('url_count', 0),
        features.get('suspicious_url_score', 0),
        features.get('urgency_score', 0),
        features.get('impersonation_score', 0),
        features.get('digit_count', 0),
        features.get('length', 0),
    ]
