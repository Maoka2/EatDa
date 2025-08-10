"""
Routers package
"""

from .generate import router as generate_router
from .ocr import router as ocr_router
from .ocr_receipt import router as ocr_receipt_router

__all__ = ["generate_router", "ocr_router", "ocr_receipt_router"]
