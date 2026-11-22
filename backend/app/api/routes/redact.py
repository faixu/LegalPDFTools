from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field
from typing import List
import io
import json
import logging

from app.models.schemas import (
    RedactRequest,
    RedactionRect,
    ProcessingResponse,
    ErrorResponse,
)
from app.services.pdf_processor import PDFProcessor
from app.core.security import validate_pdf_file
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["redaction"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


class RedactFormRequest(BaseModel):
    redactions: str = Field(..., description="JSON array of redaction rectangles")


@router.post(
    "/redact",
    response_model=ProcessingResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
@limiter.limit(f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds")
async def redact_pdf(
    request: Request,
    file: UploadFile = File(..., description="PDF file to redact"),
    redactions: str = Form(..., description="JSON array of redaction rectangles"),
):
    """
    Apply permanent redactions to a PDF document.

    - **file**: PDF file to process (max 50MB)
    - **redactions**: JSON array of redaction objects with page, x, y, width, height
      Example: [{"page": 1, "x": 100, "y": 200, "width": 150, "height": 50}]
    """
    try:
        # Validate and read file
        pdf_bytes = await validate_pdf_file(file)

        # Parse redactions JSON
        try:
            redactions_data = json.loads(redactions)
            redaction_rects = [RedactionRect(**r) for r in redactions_data]
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid redactions format: {str(e)}")

        if not redaction_rects:
            raise HTTPException(status_code=400, detail="At least one redaction is required")

        # Build request model
        redact_request = RedactRequest(redactions=redaction_rects)

        # Process PDF
        processed_bytes, page_count, processing_time = PDFProcessor.apply_redactions(
            pdf_bytes, redact_request
        )

        logger.info(f"Redaction completed: {page_count} pages, {len(redaction_rects)} redactions, {processing_time:.2f}ms")

        # Return processed file as streaming response
        return StreamingResponse(
            io.BytesIO(processed_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="redacted_{file.filename}"',
                "X-Page-Count": str(page_count),
                "X-Processing-Time-Ms": f"{processing_time:.2f}",
                "X-Redaction-Count": str(len(redaction_rects)),
            },
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Redaction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="PDF processing failed")