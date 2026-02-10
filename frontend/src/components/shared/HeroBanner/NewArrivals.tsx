import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { getNewArrivals } from '@/api/products';

const NewArrivals: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => getNewArrivals(8),
    staleTime: 5 * 60 * 1000,
  });

  // Transform API products to display format
  const products = useMemo(() => {
    if (!productsResponse?.data?.items) return [];
    return productsResponse.data.items.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      code: product.variants?.[0]?.sku || product.id.substring(0, 10),
      price: product.variants?.[0]?.calculated_price
        ? `৳ ${product.variants[0].calculated_price.toLocaleString('en-BD')}`
        : 'Price on request',
      image: product.images?.[0] || '/placeholder-product.jpg',
    }));
  }, [productsResponse]);

  const itemsPerView = typeof window !== 'undefined' && window.innerWidth >= 768 ? 4 : 1;
  const maxIndex = Math.ceil(products.length / itemsPerView) - 1;

  // Auto-slide functionality
  const resetAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
  };

  useEffect(() => {
    resetAutoSlide();
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [maxIndex]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
    if (touchStart - touchEnd < -75) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
    resetAutoSlide();
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dragEnd = e.clientX;
    if (dragStart - dragEnd > 75) {
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
    if (dragStart - dragEnd < -75) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
    resetAutoSlide();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      resetAutoSlide();
    }
  };

  return (
    <div className="w-full px-0 py-8 md:py-12 bg-footer/80">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">New Arrivals</h2>
          <p className="text-sm md:text-base text-gray-700 max-w-3xl mx-auto">
            Prepare to elevate your sense of style with our latest collection!
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative overflow-hidden mb-8">
          <div
            className="cursor-pointer active:cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`
              }}
            >
              {isLoading ? (
                <div className="w-full shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-2 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
                        <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, slideIndex) => (
                  <div
                    key={slideIndex}
                    className="w-full shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-4"
                  >
                    {products
                      .slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView)
                      .map((product) => (
                        <Link
                          key={product.id}
                          to="/products/$slug"
                          params={{ slug: product.slug }}
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                          <div className="aspect-square bg-white flex items-center justify-center p-1">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              draggable="false"
                            />
                          </div>
                          <div className="p-2 text-center">
                            <h3 className="text-sm md:text-base font-medium text-gray-800 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">{product.code}</p>
                            <p className="text-lg font-semibold text-top_bar">{product.price}</p>
                          </div>
                        </Link>
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/products"
            className="inline-block bg-header text-white font-medium px-8 py-3 rounded transition-colors duration-300 cursor-pointer hover:opacity-90"
          >
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewArrivals;