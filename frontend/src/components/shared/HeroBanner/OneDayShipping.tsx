import React, { useEffect,useRef, useState   } from 'react';

interface Product {
  id: number;
  imageUrl: string;
  name: string;
  price: string;
}

const OneDayShipping: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const products: Array<Product> = [
    {
      id: 1,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/e/r/erhrm14248_n.jpg',
      name: 'Mine Diamond Earring ERHRM14248',
      price: '₹ 48,181'
    },
    {
      id: 2,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frgen19864.jpg',
      name: 'Mine Diamond Ring FRGEN19864',
      price: '₹ 35,133'
    },
    {
      id: 3,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frgen19842.jpg',
      name: 'Mine Diamond Ring FRGEN19842',
      price: '₹ 37,718'
    },
    {
      id: 4,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frhrm13393.jpg',
      name: 'Mine Diamond Ring FRHRM13393',
      price: '₹ 42,073'
    },
    {
      id: 5,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/e/r/ergen20860.jpg',
      name: 'Mine Diamond Ring FRGEN19845',
      price: '₹ 39,450'
    },
    {
      id: 6,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frgen19862.jpg',
      name: 'Mine Diamond Ring FRGEN19862',
      price: '₹ 41,200'
    },
    {
      id: 7,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frgen19805.jpg',
      name: 'Mine Diamond Ring FRGEN19805',
      price: '₹ 38,900'
    },
    {
      id: 8,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frhrm13378.jpg',
      name: 'Mine Diamond Ring FRHRM13378',
      price: '₹ 44,320'
    },
    {
      id: 9,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/f/r/frgen19796.jpg',
      name: 'Mine Diamond Ring FRGEN19796',
      price: '₹ 36,850'
    },
    {
      id: 10,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/e/r/ergen21455.jpg',
      name: 'Mine Diamond Earring ERGEN21455',
      price: '₹ 45,600'
    },
    {
      id: 11,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/e/r/ergen21444.jpg',
      name: 'Mine Diamond Earring ERGEN21444',
      price: '₹ 43,290'
    },
    
    {
      id: 12,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/e/r/ergen20860.jpg',
      name: 'Mine Diamond Earring ERGEN21445',
      price: '₹ 44,290'
    }
  ];

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
    <div className="w-full px-2 py-8 md:py-12 bg-footer/80">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">One Day Shipping</h2>
          <p className="text-sm md:text-base text-gray-700 max-w-3xl mx-auto">
            Experience convenience with our one-day shipping, ensuring your purchase arrives at your doorstep quickly.
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
              {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className="w-full shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-4"
                >
                  {products
                    .slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      >
                        <div className="aspect-square bg-white flex items-center justify-center p-2">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            draggable="false"
                          />
                        </div>
                        <div className="p-2 text-center">
                          <h3 className="text-sm md:text-base font-medium text-gray-800 mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-lg font-semibold text-top_bar">{product.price}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button className="bg-header text-white font-semibold px-6 py-3 rounded transition-colors duration-300 cursor-pointer">
            VIEW ALL PRODUCTS
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneDayShipping;