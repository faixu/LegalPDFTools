from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
import io
import logging

from app.models.schemas import (
    BatesStampRequest,
    ProcessingResponse,
    ErrorResponse,
)
from app.services.pdf_processor import PDFProcessor
from app.core.security import validate_pdf_file
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["bates"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


@router.post(
    "/bates-stamp",
    response_model=ProcessingResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
@limiter.limit(f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds")
async def bates_stamp(
    request: "Request",
    file: UploadFile = File(..., description="PDF file to stamp"),
    prefix: str = Form(default="", max_length=50),
    start_number: int = Form(default=1, ge=1),
    font_size: float = Form(default=12.0, ge=6.0, le=72.0),
    position: str = Form(default="bottom_center"),
    color: str = Form(default="#000000", pattern=r"^#[0-9A-Fa-f]{6}$"),
    font_name: str = Form(default="helv"),
):
    """
    Apply Bates numbering to a PDF document.

    - **file**: PDF file to process (max 50MB)
    - **prefix**: Text prefix for Bates numbers (optional)
    - **start_number**: Starting number for sequence (default: 1)
    - **font_size**: Font size in points (6-72)
    - **position**: Position on page (top_left, top_center, top_right, bottom_left, bottom_center, bottom_right)
    - **color**: Hex color code (e.g., #000000)
    - **font_name**: Font to use (helv, tiro, cour, symb, zadb)
    """
    try:
        # Validate and read file
        pdf_bytes = await validate_pdf_file(file)

        # Build request model
        stamp_request = BatesStampRequest(
            prefix=prefix,
            start_number=start_number,
            font_size=font_size,
            position=position,
            color=color,
            font_name=font_name,
        )

        # Process PDF
        processed_bytes, page_count, processing_time = PDFProcessor.apply_bates_stamp(
            pdf_bytes, stamp_request
        )

        logger.info(f"Bates stamping completed: {page_count} pages, {processing_time:.2f}ms")

        # Return processed file as streaming response
        return StreamingResponse(
            io.BytesIO(processed_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="bates_stamped_{file.filename}"',
                "X-Page-Count": str(page_count),
                "X-Processing-Time-Ms": f"{processing_time:.2f}",
            },
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Bates stamping failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="PDF processing failed")