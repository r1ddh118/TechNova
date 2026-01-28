import re
import tldextract


def url_features(text: str):
    """Return (url_count, suspicious_score).

    Suspicion heuristics:
    - long domain (>15)
    - digits in domain
    - hyphens in domain
    - mismatched anchor text not available offline (skip)
    """
    if not isinstance(text, str):
        text = str(text)

    urls = re.findall(r"(https?://\S+)", text)

    suspicious = 0
    for url in urls:
        try:
            ext = tldextract.extract(url)
            domain = ext.domain or ""
        except Exception:
            domain = ""

        if len(domain) > 15:
            suspicious += 1
        if any(char.isdigit() for char in domain):
            suspicious += 1
        if "-" in domain:
            suspicious += 1

    return len(urls), suspicious
