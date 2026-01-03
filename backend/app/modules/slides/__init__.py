"""
Slides module for homepage banners/carousels.
"""
from app.modules.slides.models import Slide
from app.modules.slides.service import SlideService
from app.modules.slides.endpoints import router

__all__ = ["Slide", "SlideService", "router"]
