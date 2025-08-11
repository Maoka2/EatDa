"""
Routers package
"""
from .stream_test import router as stream_test_router
from .menuboard_ocr import router as menuboard_ocr_router
from .receipt_ocr import router as receipt_ocr_router

__all__ =  ["stream_test_router", "menuboard_ocr_router", "receipt_ocr_router"]
