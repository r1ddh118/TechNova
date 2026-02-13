import re
import tldextract

EXTRACTOR = tldextract.TLDExtract(suffix_list_urls=None)


SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly",
    "rb.gy", "rebrand.ly", "shorturl.at", "tiny.cc", "lnkd.in"
}

SUSPICIOUS_SUBDOMAIN_HINTS = {
    "login", "secure", "verify", "update", "signin", "account", "wallet", "support", "helpdesk"
}

BRAND_DOMAINS = {
    "paypal", "microsoft", "google", "apple", "amazon", "netflix", "instagram", "facebook", "bankofamerica"
}

CONFUSABLES = str.maketrans({"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "$": "s", "@": "a"})


def _looks_like_ip(host: str) -> bool:
    return bool(re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", host or ""))


def _is_shortener(host: str) -> bool:
    return (host or "").lower() in SHORTENER_DOMAINS


def _has_suspicious_subdomain(host: str) -> bool:
    parts = (host or "").lower().split(".")
    if len(parts) <= 2:
        return False
    subdomain = ".".join(parts[:-2])
    return any(hint in subdomain for hint in SUSPICIOUS_SUBDOMAIN_HINTS)


def _domain_similarity(domain: str) -> bool:
    d = (domain or "").lower()
    if not d or d in BRAND_DOMAINS:
        return False
    normalized = d.translate(CONFUSABLES)
    return normalized in BRAND_DOMAINS


def analyze_urls(text: str):
    """Analyze URLs and return rich feature flags for explainability."""
    urls = re.findall(r"(https?://\S+)", text)
    details = {
        "url_count": len(urls),
        "long_domain_count": 0,
        "digit_domain_count": 0,
        "hyphen_domain_count": 0,
        "ip_url_count": 0,
        "shortener_url_count": 0,
        "suspicious_subdomain_count": 0,
        "lookalike_domain_count": 0,
    }

    for url in urls:
        try:
            ext = EXTRACTOR(url)
            host = ".".join(part for part in [ext.subdomain, ext.domain, ext.suffix] if part)
            domain = ext.domain or ""
        except Exception:
            host = ""
            domain = ""

        if len(domain) > 15:
            details["long_domain_count"] += 1
        if any(char.isdigit() for char in domain):
            details["digit_domain_count"] += 1
        if "-" in domain:
            details["hyphen_domain_count"] += 1
        if _looks_like_ip(host):
            details["ip_url_count"] += 1
        if _is_shortener(host):
            details["shortener_url_count"] += 1
        if _has_suspicious_subdomain(host):
            details["suspicious_subdomain_count"] += 1
        if _domain_similarity(domain):
            details["lookalike_domain_count"] += 1

    details["suspicious_score"] = sum(v for k, v in details.items() if k.endswith("_count") and k != "url_count")
    return details


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

    details = analyze_urls(text)
    return details["url_count"], details["suspicious_score"]
