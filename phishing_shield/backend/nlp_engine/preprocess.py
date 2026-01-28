import re
import unicodedata

URL_RE = re.compile(r"(https?://\S+|hxxp://\S+|http:\/\/\S+|www\.\S+)", re.IGNORECASE)
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+")


def clean_text(text: str) -> str:
    """Normalize whitespace, remove control chars, normalize unicode, lowercase."""
    if not isinstance(text, str):
        text = str(text)
    # normalize unicode
    text = unicodedata.normalize("NFKC", text)
    # replace obfuscated URL patterns like hxxp, [.]
    text = text.replace("hxxp://", "http://")
    text = text.replace("[.]", ".")
    # collapse whitespace
    text = re.sub(r"\s+", " ", text)
    # remove control chars
    text = re.sub(r"[\r\n\t]+", " ", text)
    return text.strip()


def extract_urls(text: str):
    return URL_RE.findall(text)
