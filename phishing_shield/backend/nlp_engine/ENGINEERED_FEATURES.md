# Engineered Features (NLP Security Pipeline)

This document describes all engineered features produced by `extract_features` and consumed by the vectorizer.

## URL-based features
- `url_count`: Number of HTTP/HTTPS URLs detected in the text.
- `suspicious_url_score`: Aggregate suspicious URL score (sum of URL-risk counters below).
- `ip_url_count`: URLs using direct IPv4 hosts instead of domain names.
- `shortener_url_count`: URLs that use known shortening domains (e.g., `bit.ly`, `t.co`).
- `suspicious_subdomain_count`: URLs where subdomains include risky hints (e.g., `login`, `secure`, `verify`, `account`).
- `lookalike_domain_count`: URLs whose domain resembles a major brand after confusable-character normalization (e.g., `paypa1` -> `paypal`).

## Content/security signal features
- `urgency_score`: Count of urgency-pressure phrases from `urgency_detector.py`.
- `impersonation_score`: Count of organizational impersonation keywords from `impersonation_detector.py`.
- `credential_request_score`: Count of credential-harvesting indicators (password/OTP/PIN/CVV/bank details).

## Structural features
- `digit_count`: Number of digits found in normalized text.
- `length`: Character length of normalized text.
- `email_addresses`: Extracted email addresses found in text.

## Explainability output
- `explanations`: List of entries with:
  - `feature`: feature name that fired
  - `value`: numeric feature value
  - `reason`: human-readable rationale for analysts/end-users

In generated CSV exports, this is flattened into a `feature:reason` pipe-delimited string.
