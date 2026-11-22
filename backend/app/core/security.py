from fastapi import UploadFile, HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
import logging
import sys

logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Try to import magic, fallback gracefully on Windows
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    logger.warning("python-magic not available, falling back to header-only PDF validation")


async def validate_pdf_file(file: UploadFile) -> bytes:
    """
    Validate uploaded file is a PDF using magic bytes (not extension).
    Returns file content as bytes for in-memory processing.
    """
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Validate MIME type using python-magic (magic bytes) if available
    if HAS_MAGIC:
        try:
            mime = magic.Magic(mime=True)
            file_mime = mime.from_buffer(content)

            if file_mime not in settings.ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type. Only PDF files are allowed. Detected: {file_mime}"
                )
        except Exception as e:
            logger.warning(f"Magic detection failed, falling back to header check: {e}")

    # Additional PDF header validation (always performed)
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file: missing PDF header"
        )

    # Reset file pointer for potential re-reading
    await file.seek(0)

    return content


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # CSP for API
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        return response


def setup_rate_limiting(app):
    """Configure rate limiting for the FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)