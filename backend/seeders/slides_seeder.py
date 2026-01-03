"""
Slides Seeder - Seeds example homepage slides.
"""
from sqlmodel import select
from seeders.base import BaseSeeder
from app.modules.slides.models import Slide, SlideType


class SlidesSeeder(BaseSeeder):
    """Seed example slides."""
    
    order = 40
    
    SLIDES_DATA = [
        {
            "title": "Welcome to Our Store",
            "subtitle": "Discover the finest jewelry collection",
            "image_url": "https://images.unsplash.com/photo-1515562141207-7a88fb056d03?q=80&w=2574&auto=format&fit=crop",
            "slide_type": SlideType.BANNER,
            "link_text": "Shop Now",
            "link_url": "/products",
            "sort_order": 0
        },
        {
            "title": "Summer Collection",
            "subtitle": "Shine bright this season",
            "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2669&auto=format&fit=crop",
            "slide_type": SlideType.PROMO,
            "link_text": "View Collection",
            "link_url": "/collections/summer",
            "sort_order": 1
        }
    ]
    
    async def should_run(self) -> bool:
        """Run if no slides exist."""
        result = await self.session.execute(select(Slide))
        return result.first() is None
    
    async def run(self) -> None:
        """Seed slides."""
        for slide_data in self.SLIDES_DATA:
            slide = Slide(**slide_data)
            self.session.add(slide)
        
        await self.session.commit()
        print(f"  ✅ Seeded {len(self.SLIDES_DATA)} example slides")
