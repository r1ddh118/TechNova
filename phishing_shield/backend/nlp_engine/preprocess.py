import re
import unicodedata
from typing import List, Union

# Patterns
URL_RE = re.compile(r"(https?://\S+|hxxp://\S+|http://\S+|www\.\S+)", re.IGNORECASE)
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+")


def clean_text(text: str) -> str:
    """Normalize text: unicode normalization, deobfuscation of simple patterns, collapse whitespace."""
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    text = unicodedata.normalize("NFKC", text)
    # Normalize common obfuscations
    text = text.replace("hxxp://", "http://")
    text = text.replace("hxxps://", "https://")
    text = text.replace("[.]", ".")
    # remove excessive whitespace and control chars
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def deobfuscate_urls(text: str) -> str:
    """Perform additional cleanup for spaced/obfuscated URLs (best-effort)."""
    if text is None:
        return ""
    t = str(text)
    # collapse common spaced-out http patterns like 'h t t p : / /'
    t = re.sub(r"h\s*t\s*t\s*p\s*s?\s*:\s*/\s*/", "http://", t, flags=re.IGNORECASE)
    t = t.replace("[.]", ".")
    t = t.replace("(dot)", ".")
    t = re.sub(r"\s+", " ", t)
    return t


def extract_urls(text: str) -> List[str]:
    """Return list of URL-like tokens detected in text (best-effort)."""
    if text is None:
        return []
    t = deobfuscate_urls(text)
    return URL_RE.findall(t)


def extract_email_addresses(text: str) -> List[str]:
    if text is None:
        return []
    return EMAIL_RE.findall(str(text))


def combine_subject_body(subject: Union[str, None], body: Union[str, None]) -> str:
    """Combine subject and body into a single cleaned text string for downstream processing."""
    parts = []
    if subject:
        parts.append(str(subject))
    if body:
        parts.append(str(body))
    combined = " - ".join(parts)
    return clean_text(combined)
