import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Phone  } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function ProductLayout() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Product data (will come from backend)
  const product = {
    name: "Malabar Gold Ring",
    code: "FRDZL46035",
    price: 84111,
    originalPrice: 136881,
    discount: 10,
    availability: "In stock",
    description: "Free Shipping In India | Hallmarked jewellery available for sale",
    images: [
      "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/small_image/9df78eab33525d08d6e5fb8d27136e95/f/r/frdzl46035.jpg",
      "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/500x500/9df78eab33525d08d6e5fb8d27136e95/f/r/frdzl46035_1.jpg",
      "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/image/500x500/9df78eab33525d08d6e5fb8d27136e95/f/r/frdzl46035_2.jpg"
    ],
    specifications: {
      size: "23 (62.7 mm)",
      goldColor: "Rose",
      productType: "Ring",
      brand: "Malabar",
      gender: "Men",
      metalPurity: "18 KT (750)",
      metalColor: "Rose",
      grossWeight: "6.500",
      netWeight: "6.470"
    },
    priceBreakup: {
      gold: 68093,
      otherStone: 195,
      making: 15485,
      tax: 2450
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleBuyNow = () => {
    // Navigate to cart page
    navigate({ to: '/cart' });
  };

  return (
    <div className="w-full bg-gray-50">
      {/* Container with responsive padding */}
      <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Main Grid - Stack on mobile, side-by-side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            
            {/* Left Side - Images */}
            <div className="space-y-3 sm:space-y-4">
              <div className="relative bg-white  rounded-lg overflow-hidden aspect-square">
                <button className="absolute top-2 right-2 sm:top-2 sm:right-2 z-10 p-1.5 sm:p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors">
                  <Heart className="w-5 h-5 sm:w-5 sm:h-5 text-header" />
                </button>
                
                {/* Navigation arrows for mobile */}
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors md:hidden"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors md:hidden"
                >
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
                
                <div 
                  className="w-full h-full cursor-crosshair relative"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 sm:p-6 lg:p-8"
                    style={{
                      transform: isZoomed ? 'scale(2)' : 'scale(1)',
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                      transition: isZoomed ? 'none' : 'transform 0.3s ease'
                    }}
                  />
                </div>
                
                {isZoomed && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs sm:text-sm">
                    Hover to zoom
                  </div>
                )}

                {/* Image counter for mobile */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-xs md:hidden">
                  {selectedImage + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnail Images - Hidden on small screens, visible on md+ */}
              <div className="hidden md:flex gap-2 lg:gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === idx ? 'border-header' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Thumbnail dots for mobile */}
              <div className="flex md:hidden justify-center gap-2">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      selectedImage === idx ? 'bg-purple-600 w-6' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side - Product Details */}
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">Product Code: {product.code}</p>
                <p className="text-xs sm:text-sm text-gray-700 mt-2">{product.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Availability:</span>
                <span className="text-xs sm:text-sm text-green-500 font-semibold">{product.availability}</span>
              </div>

              {/* Price Section */}
              <div className="border-t border-b border-gray-200 py-3 sm:py-4">
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-header">₹ {product.price.toLocaleString()}</span>
                  <span className="text-base sm:text-lg lg:text-xl text-gray-400 line-through">₹ {product.originalPrice.toLocaleString()}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">(inclusive of all taxes)</p>
                <p className="text-xs sm:text-sm text-header mt-4">{product.discount}% savings on making charges</p>
              </div>

              {/* Size and Color Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Size:</label>
                  <select className="w-full border border-header/90 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-header focus:border-transparent">
                    <option>{product.specifications.size}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Gold Color:</label>
                  <select className="w-full border border-header/90 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-header focus:border-transparent">
                    <option>{product.specifications.goldColor}</option>
                  </select>
                </div>
              </div>

              {/* Price Breakup */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Price Breakup</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gold</span>
                    <span className="font-medium">₹ {product.priceBreakup.gold.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Stone</span>
                    <span className="font-medium">₹ {product.priceBreakup.otherStone.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Making</span>
                    <span className="font-medium">₹ {product.priceBreakup.making.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹ {product.priceBreakup.tax.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Buy Button */}
              <button 
                onClick={handleBuyNow}
                className="w-full bg-header hover:bg-header/90 text-white font-semibold py-3 sm:py-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Buy Now
              </button>

              {/* Contact Section */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 pt-3 sm:pt-4 border-t">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-header" />
                  <span>+91 22 62300916</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-header" />
                  <span>+91 9167780916</span>
                </div>
              </div>

              {/* Certification */}
              <div className="flex items-center justify-center gap-3 pt-3 sm:pt-4">
                <span className="text-xs sm:text-sm text-gray-600 text-center">100% Certified by International Standards</span>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Basic Information</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Product Type</span>
                    <span className="font-medium text-right">{product.specifications.productType}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Brand</span>
                    <span className="font-medium text-right">{product.specifications.brand}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Gender</span>
                    <span className="font-medium text-right">{product.specifications.gender}</span>
                  </div>
                </div>
              </div>

              {/* Metal Information */}
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Metal Information</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Metal Purity</span>
                    <span className="font-medium text-right">{product.specifications.metalPurity}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Metal Color</span>
                    <span className="font-medium text-right">{product.specifications.metalColor}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Gross Weight (g)</span>
                    <span className="font-medium text-right">{product.specifications.grossWeight}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Net Weight (g)</span>
                    <span className="font-medium text-right">{product.specifications.netWeight}</span>
                  </div>
                </div>
              </div>

              {/* Certification Details */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Certification Details</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Gold Certification</span>
                    <span className="font-medium text-right">BIS Hallmark 750</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Hallmark License No</span>
                    <span className="font-medium text-right break-all">HMC-7790174629</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}