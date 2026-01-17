import  { useState } from 'react';
import { ChevronDown,  Heart, Loader2, X } from 'lucide-react';

const Diamond = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(true);

  const products = [
    { id: 1, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/o/b/obstr10005_c.jpg', price: 52217, oldPrice: 53017, sku: 'OBSTR10005', discount: '10% OFF' },
    { id: 2, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/o/b/obstr10003_c.jpg', price: 52469, oldPrice: 53004, sku: 'OBSTR10003', discount: '10% OFF' },
    { id: 3, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/f/r/frevr10340.jpg', price: 100216, oldPrice: 104527, sku: 'FREVR10340', discount: '30% OFF' },
    { id: 4, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/f/r/frzol10070.jpg', price: 37611, oldPrice: 38792, sku: 'FRZOL10070', discount: '10% OFF' },
    { id: 5, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/f/r/frzol10072.jpg', price: 45230, oldPrice: 48100, sku: 'FRZOL10072', discount: '15% OFF' },
    { id: 6, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/o/b/obzol10031.jpg', price: 62890, oldPrice: 67200, sku: 'OBZOL10031', discount: '20% OFF' },
    { id: 7, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/f/r/frzol10069.jpg', price: 38450, oldPrice: 39800, sku: 'FRZOL10069', discount: '10% OFF' },
    { id: 8, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/e/r/erzol10056.jpg', price: 55670, oldPrice: 59200, sku: 'ERZOL10056', discount: '15% OFF' },
    { id: 9, img: 'https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/thumbnail/433x/0dc2d03fe217f8c83829496872af24a0/o/b/obstr10005_c.jpg', price: 52217, oldPrice: 53017, sku: 'OBSTR10005', discount: '10% OFF' },

  ];

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) {
        newFavs.delete(id);
      } else {
        newFavs.add(id);
      }
      return newFavs;
    });
    
    // TODO: Call backend API to add/remove from wishlist
    // Example:
    // const isRemoving = favorites.has(id);
    // fetch('/api/wishlist', {
    //   method: isRemoving ? 'DELETE' : 'POST',
    //   body: JSON.stringify({ productId: id })
    // });
  };

  const handleShowMore = () => {
    setLoading(true);
    
    // TODO: Fetch more products from backend
    // Example:
    // fetch(`/api/products?page=${nextPage}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     setProducts(prev => [...prev, ...data.products]);
    //     setLoading(false);
    //     if (!data.hasMore) setShowMore(false);
    //   });
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      // Simulate no more products after one click
      setShowMore(false);
    }, 2000);
  };

  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full md:max-w-3xl lg:max-w-5xl h-full overflow-y-auto">
        <div className="sticky top-20 bg-white border-b px-4 sm:px-6 py-7 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-xl font-semibold">FILTER BY</h2>
          <button onClick={() => setShowFilters(false)} className="p-0 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6">
          {/* Product Size */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">PRODUCT SIZE</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['22 (62.1 mm)', '21 (60.8 mm)', '20 (60.2 mm)', '19 (58.9 mm)', '18 (58.3 mm)', '17 (57 mm)'].map((size, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{size}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Metal Colour */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">METAL COLOUR</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Yellow (371)', 'White (30)', 'Rose (2195)', 'Two Tone (47)', 'Three Tone (2)'].map((color, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{color}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">SIZE</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['12 (51.9 mm) (597)', '13 (53.1 mm) (497)', '14 (54.4 mm) (526)', '18 (58.3 mm) (66)', '19 (58.9 mm) (60)'].map((s, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Design Type */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">DESIGN TYPE</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Eternity (4)', 'Oval (142)', 'Band (7)', 'Solitaire (5)', 'Chain (7)', 'Jhumki (4)', 'Drops (120)'].map((design, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{design}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Metal Purity */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">METAL PURITY</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['14 KT (585) (2)', '18 KT (750) (2479)', '22 KT (916) (154)', 'PT (950) (5)'].map((purity, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{purity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">THEME</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Fancy (100)', 'Peacock (1)', 'Spiritual (3)', 'Traditional (36)', 'Floral (71)', 'Cluster (63)', 'Geometric (42)'].map((theme, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{theme}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Wearing Style */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">WEARING STYLE</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Daily Wear (919)', 'Casual Wear (1068)', 'Office Wear (236)', 'Party Wear (503)'].map((style, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{style}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Collection */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">COLLECTION</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Tushi (7)', 'Gemstone Jewellery Festival (3)', 'Zoul (205)', 'Dia (244)', 'Blossom (1)', 'Verza (77)'].map((collection, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{collection}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">GENDER</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Women (2523)', 'Men (113)', 'Unisex (3)', 'Kids (1)'].map((gender, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{gender}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">OCCASION</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['Anniversary', 'Wedding', 'Engagement', 'Festive Gift', 'Birthday', 'Diwali', 'Baby Birth'].map((occasion, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{occasion}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Weight Range */}
          <div>
            <h3 className="font-semibold mb-3 text-xs sm:text-sm">WEIGHT RANGE</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {['0.0-2.0 Grams (573)', '2.01-4.0 Grams (895)', '4.01-6.0 Grams (321)', '6.01-10.0 Grams (261)', '10.01-20.0 Grams (131)', '20.01-35.0 Grams (68)', '35.01-50.0 Grams (21)'].map((weight, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{weight}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4 flex gap-3 sm:gap-4">
          <button className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded hover:bg-gray-50 text-sm sm:text-base">
            CLEAR ALL
          </button>
          <button className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-header text-white rounded hover:bg-header/90 text-sm sm:text-base">
            APPLY FILTERS
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="relative">
        <img 
          src="https://static.malabargoldanddiamonds.com/media/catalog/category/Category_diamond-jewellery_1_1.jpg" 
          alt="Diamond Jewellery"
          className="w-full h-auto sm:h-40 md:h-48 lg:h-56 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-end px-2 sm:px-8 md:pr-4 lg:pr-16">
          <div className="text-right">
            <h1 className="text-md sm:text-md md:text-2xl lg:text-3xl font-light text-header">Jewellery Designs for Women</h1>
            
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
        <span>Home</span> / <span>Categories</span> / <span className="font-medium">Diamond</span>
      </div>

      {/* Filters Bar */}
      <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-y">
        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between gap-3">
          <button 
            onClick={() => setShowFilters(true)}
            className="flex-1 px-4 py-2 border rounded cursor-pointer hover:border-purple-900 flex items-center justify-center gap-2 text-sm"
          >
            FILTERS <ChevronDown size={16} />
          </button>
          
          <select className="flex-1 px-3 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
            <option>SORT BY</option>
            <option>Popular</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>New Arrival</option>
          </select>
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex gap-4 xl:gap-6 flex-wrap">
            <select className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
              <option>BRANDS</option>
              <option>NazuMeah</option>
              <option>Mine</option>
              <option>Zoul</option>
            </select>

            <select className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
              <option>PRODUCT TYPE</option>
              <option>Ring</option>
              <option>Earring</option>
              <option>Pendant</option>
              <option>Pendant Set</option>
              <option>Nosepin</option>
              <option>Bangle</option>
              <option>Necklace</option>
              <option>Necklace Set</option>
              <option>Chain</option>
              <option>Mangalsutra</option>
              <option>Bracelet</option>
            </select>

            <select className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
              <option>STOCK STATUS</option>
              <option>In Stock</option>
              <option>Pre-order</option>
            </select>

            <select className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
              <option>PRICE</option>
              <option>0-10000</option>
              <option>10000-20000</option>
              <option>20000-50000</option>
              <option>50000-above</option>
            </select>

            <select className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
              <option>OFFER</option>
              <option>10% OFF</option>
              <option>15% OFF</option>
              <option>20% OFF</option>
              <option>30% OFF</option>
            </select>

            <button 
              onClick={() => setShowFilters(true)}
              className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 flex items-center gap-2 text-sm"
            >
              MORE FILTERS <ChevronDown size={16} />
            </button>
          </div>

          <select className="px-3 xl:px-4 py-2 border rounded cursor-pointer hover:border-purple-900 text-sm">
            <option>SORT BY</option>
            <option>Popular</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>New Arrival</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                <img 
                  src={product.img} 
                  alt={product.sku}
                  className="w-full h-56 sm:h-64 md:h-72 object-cover"
                />
                <button 
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <Heart 
                    size={18} 
                    className={favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                  />
                </button>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg sm:text-xl font-semibold text-header">₹ {product.price.toLocaleString()}</span>
                  <span className="text-xs sm:text-sm text-gray-400 line-through">₹ {product.oldPrice.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">SKU : {product.sku}</div>
                <div className="text-xs text-green-600 font-medium">{product.discount} DIAMOND CHARGES</div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <Loader2 className="animate-spin text-header" size={40} />
          </div>
        )}

        {/* Show More Button */}
        {!loading && showMore && (
          <div className="flex justify-center mt-8 sm:mt-12">
            <button 
              onClick={handleShowMore}
              className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-header text-header rounded-lg hover:bg-header/90 hover:text-white transition-colors font-medium text-sm sm:text-base"
            >
              SHOW MORE
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && <FilterModal />}
    </div>
  );
};

export default Diamond;