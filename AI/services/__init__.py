"""
Services package
"""

# Ensure import paths are robust in both layouts:
# - flat:   /app/services, /app/clients
# - nested: /app/AI/services, /app/AI/clients
import os, sys
_CUR = os.path.abspath(os.path.dirname(__file__))
_ROOT_FLAT = os.path.abspath(os.path.join(_CUR, ".."))
_ROOT_REPO = os.path.abspath(os.path.join(_CUR, "..", ".."))
for p in (_ROOT_FLAT, _ROOT_REPO):
    if p not in sys.path:
        sys.path.insert(0, p)

from .luma_service import luma_service
from .runway_service import runway_service
from .image_service import image_service
from .google_image_service import google_image_service
from .gpt_service import gpt_service
from .menuboard_ocr_service import menuboard_ocr_service

__all__ = [
    "luma_service",
    "runway_service",
    "gpt_service",
    "menuboard_ocr_service",
    "image_service",
    "google_image_service",
]
