from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from enum import Enum


class BatesPosition(str, Enum):
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"


class RedactionRect(BaseModel):
    page: int = Field(..., ge=1, description="Page number (1-indexed)")
    x: float = Field(..., ge=0, description="X coordinate in points")
    y: float = Field(..., ge=0, description="Y coordinate in points")
    width: float = Field(..., gt=0, description="Width in points")
    height: float = Field(..., gt=0, description="Height in points")


class BatesStampRequest(BaseModel):
    prefix: str = Field(default="", max_length=50, description="Prefix for Bates numbers")
    start_number: int = Field(default=1, ge=1, description="Starting Bates number")
    font_size: float = Field(default=12.0, ge=6.0, le=72.0, description="Font size in points")
    position: BatesPosition = Field(default=BatesPosition.BOTTOM_CENTER, description="Position on page")
    color: str = Field(default="#000000", pattern=r"^#[0-9A-Fa-f]{6}$", description="Hex color code")
    font_name: str = Field(default="helv", description="Font name (helv, tiro, cour, symb, zadb)")


class RedactRequest(BaseModel):
    redactions: List[RedactionRect] = Field(..., min_length=1, max_length=500)


class ProcessingResponse(BaseModel):
    success: bool
    message: str
    page_count: int
    processing_time_ms: float
    download_url: Optional[str] = None
    file_size_bytes: Optional[int] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None