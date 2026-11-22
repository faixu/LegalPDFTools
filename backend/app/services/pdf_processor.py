import fitz  # PyMuPDF
import time
import logging
from typing import Tuple
from app.models.schemas import BatesStampRequest, RedactRequest, RedactionRect, BatesPosition

logger = logging.getLogger(__name__)


class PDFProcessor:
    """RAM-only PDF processing using PyMuPDF."""

    # Position mappings for Bates numbers
    POSITION_OFFSETS = {
        BatesPosition.TOP_LEFT: (72, 72),  # 1 inch from top-left
        BatesPosition.TOP_CENTER: (0.5, 72),  # Center top, 1 inch down
        BatesPosition.TOP_RIGHT: (-72, 72),  # 1 inch from top-right
        BatesPosition.BOTTOM_LEFT: (72, -72),  # 1 inch from bottom-left
        BatesPosition.BOTTOM_CENTER: (0.5, -72),  # Center bottom, 1 inch up
        BatesPosition.BOTTOM_RIGHT: (-72, -72),  # 1 inch from bottom-right
    }

    FONT_MAP = {
        "helv": "helv",  # Helvetica
        "tiro": "tiro",  # Times Roman
        "cour": "cour",  # Courier
        "symb": "symb",  # Symbol
        "zadb": "zadb",  # ZapfDingbats
    }

    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[float, float, float]:
        """Convert hex color to RGB tuple (0-1 range)."""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))

    @classmethod
    def apply_bates_stamp(cls, pdf_bytes: bytes, request: BatesStampRequest) -> Tuple[bytes, int, float]:
        """
        Apply Bates numbering to all pages of a PDF.
        Returns: (processed_pdf_bytes, page_count, processing_time_ms)
        """
        start_time = time.perf_counter()

        # Open PDF from memory
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)

        try:
            font_name = cls.FONT_MAP.get(request.font_name, "helv")
            color_rgb = cls.hex_to_rgb(request.color)
            current_number = request.start_number

            for page_num in range(page_count):
                page = doc[page_num]
                page_rect = page.rect

                # Calculate position
                x_offset, y_offset = cls.POSITION_OFFSETS[request.position]

                if x_offset == 0.5:  # Center horizontally
                    x = page_rect.width / 2
                elif x_offset > 0:
                    x = x_offset
                else:
                    x = page_rect.width + x_offset

                if y_offset > 0:
                    y = y_offset
                else:
                    y = page_rect.height + y_offset

                # Create Bates text
                bates_text = f"{request.prefix}{current_number:06d}"
                current_number += 1

                # Insert text
                page.insert_text(
                    (x, y),
                    bates_text,
                    fontsize=request.font_size,
                    fontname=font_name,
                    color=color_rgb,
                    render_mode=0,  # Fill text
                )

            # Save to bytes
            output_bytes = doc.tobytes(
                garbage=4,
                deflate=True,
                clean=True,
            )

            processing_time = (time.perf_counter() - start_time) * 1000
            return output_bytes, page_count, processing_time

        finally:
            doc.close()

    @classmethod
    def apply_redactions(cls, pdf_bytes: bytes, request: RedactRequest) -> Tuple[bytes, int, float]:
        """
        Apply permanent redactions to PDF pages.
        Returns: (processed_pdf_bytes, page_count, processing_time_ms)
        """
        start_time = time.perf_counter()

        # Open PDF from memory
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)

        try:
            # Group redactions by page
            redactions_by_page = {}
            for redaction in request.redactions:
                page_idx = redaction.page - 1  # Convert to 0-indexed
                if 0 <= page_idx < page_count:
                    if page_idx not in redactions_by_page:
                        redactions_by_page[page_idx] = []
                    redactions_by_page[page_idx].append(redaction)

            # Apply redactions to each page
            for page_idx, redactions in redactions_by_page.items():
                page = doc[page_idx]

                for redaction in redactions:
                    # Create rectangle for redaction
                    rect = fitz.Rect(
                        redaction.x,
                        redaction.y,
                        redaction.x + redaction.width,
                        redaction.y + redaction.height
                    )

                    # Add redaction annotation (permanent removal)
                    page.add_redact_annot(
                        rect,
                        fill=(0, 0, 0),  # Black fill
                        text="",  # No overlay text
                        fontsize=0,
                    )

                # Apply redactions - this permanently removes content
                page.apply_redactions(
                    images=fitz.PDF_REDACT_IMAGE_REMOVE,  # Remove images in redacted area
                    graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED,  # Remove vector graphics
                    text=fitz.PDF_REDACT_TEXT_REMOVE,  # Remove text
                )

            # Save to bytes
            output_bytes = doc.tobytes(
                garbage=4,
                deflate=True,
                clean=True,
            )

            processing_time = (time.perf_counter() - start_time) * 1000
            return output_bytes, page_count, processing_time

        finally:
            doc.close()

    @staticmethod
    def get_pdf_info(pdf_bytes: bytes) -> dict:
        """Get basic PDF info without processing."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            return {
                "page_count": len(doc),
                "metadata": doc.metadata,
                "is_encrypted": doc.is_encrypted,
            }
        finally:
            doc.close()