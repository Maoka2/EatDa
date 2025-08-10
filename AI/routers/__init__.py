"""
Routers package
"""
from .ocr import router as ocr_router
from .ocr_receipt import router as ocr_receipt_router
from .stream_test import router as stream_test_router

__all__ = ["ocr_router", "ocr_receipt_router", "stream_test_router"]
