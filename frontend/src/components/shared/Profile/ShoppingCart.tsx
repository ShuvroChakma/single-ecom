import { useState } from 'react';
import { AlertCircle, ArrowLeftRight, BadgeCheck, CheckCircle, Eye, Gem, Loader2, Minus, Phone, Plus, RefreshCw, RotateCcw, Shield, Tag, TrendingUp, Wrench, X } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CartItem, PromoValidationResult } from '@/api/cart';
import { getCart, removeFromCart, updateCartItem, validatePromoCode } from '@/api/cart';
import { getImageUrl } from '@/api/client';

export default function ShoppingCart() {
  const [showProductDetails, setShowProductDetails] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoValidationResult | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cartResponse, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(),
    staleTime: 60 * 1000, // 1 minute
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem({ data: { itemId, quantity } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeFromCart({ data: { itemId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const validatePromoMutation = useMutation({
    mutationFn: (code: string) => validatePromoCode({ data: { code, order_amount: cart?.subtotal || 0 } }),
    onSuccess: (response) => {
      if (response.data) {
        setPromoResult(response.data);
        if (response.data.valid) {
          setPromoCode('');
        }
      }
    },
  });

  const cart = cartResponse?.data;
  const cartItems = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0);
  const taxAmount = Number(cart?.tax_amount || 0);
  const discount = promoResult?.valid ? Number(promoResult.discount_amount) : 0;
  const total = subtotal + taxAmount - discount;

  const promiseFeatures = [
    { icon: Wrench,       title: 'Lifetime',       subtitle: 'Maintenance' },
    { icon: Shield,       title: 'Your Jewellery', subtitle: 'is Insured' },
    { icon: RotateCcw,    title: '14 Days',        subtitle: 'Return Policy' },
    { icon: ArrowLeftRight, title: 'Zero Deduction', subtitle: 'Gold Exchange' },
    { icon: BadgeCheck,   title: 'BIS 916',        subtitle: 'Hallmarked Pure Gold' },
    { icon: TrendingUp,   title: 'Guaranteed',     subtitle: 'Buyback' },
    { icon: Gem,          title: 'Certified',      subtitle: 'Diamonds' },
    { icon: Eye,          title: 'Complete',       subtitle: 'Transparency' },
    { icon: RefreshCw,    title: 'Easy',           subtitle: 'Exchange' },
  ];

  const paymentLogos = [
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/320px-Visa_Inc._logo.svg.png", alt: "Visa", height: "h-6" },
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/320px-Mastercard-logo.svg.png", alt: "Mastercard", height: "h-8" },
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/601px-American_Express_logo_%282018%29.svg.png", alt: "American Express", height: "h-6" }
  ];

  const handlePlaceOrder = () => {
    // Navigate to cart page
    navigate({ to: '/checkout' });
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-header" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some items to get started</p>
          <Link to="/products" className="bg-header text-white px-6 py-3 rounded font-medium hover:opacity-90">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden md:block max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Cart Items */}
          <div className="lg:col-span-2">
            {/* Cart Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Shopping Cart</h1>
                <span className="text-lg font-medium">৳ {total.toLocaleString('en-BD')}</span>
              </div>
              <p className="text-gray-600 mb-4">Total ({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})</p>

              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex gap-4">
                      <img
                        src={getImageUrl(item.product.image, '/placeholder-product.jpg')}
                        alt={item.product.name}
                        className="w-24 h-24 object-contain bg-white rounded"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                            <p className="text-sm text-gray-500 mb-3">SKU: {item.variant.sku}</p>

                            <p className="text-sm text-gray-600 mb-2">
                              {item.variant.metal_type} {item.variant.metal_purity} - {item.variant.metal_color}
                              {item.variant.size && ` - Size ${item.variant.size}`}
                            </p>

                            {item.price_changed && (
                              <p className="text-xs text-amber-600 flex items-center gap-1 mb-2">
                                <AlertCircle className="w-3 h-3" />
                                Price changed since adding to cart
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-sm text-gray-600">Qty:</span>
                              <div className="flex items-center border rounded">
                                <button
                                  onClick={() => updateItemMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                                  disabled={item.quantity <= 1 || updateItemMutation.isPending}
                                  className="p-1 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                                  disabled={updateItemMutation.isPending}
                                  className="p-1 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="font-semibold text-lg">৳ {Number(item.line_total).toLocaleString('en-BD')}</span>
                            <button
                              onClick={() => removeItemMutation.mutate(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-sm border border-gray-300 px-4 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promise Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-xl font-semibold">OUR</div>
                <div className="text-xl font-semibold">PR<span className="inline-flex items-center justify-center py-2 w-5 h-5 bg-header text-white rounded-full text-sm">✓</span>MISE</div>
              </div>
              <h3 className="font-medium mb-6">9 Reasons To Shop With Us!</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {promiseFeatures.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-2 p-2">
                      <item.icon className="w-7 h-7 text-header" />
                    </div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Options */}
            <div className="mt-4 flex gap-4 items-center justify-center flex-wrap">
              {paymentLogos.map((logo, idx) => (
                <img key={idx} src={logo.src} alt={logo.alt} className={logo.height} />
              ))}
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5"/>
                  <span className="font-medium">Apply Coupon Code</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoResult(null);
                    }}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="Enter coupon code"
                  />
                  <button
                    onClick={() => promoCode && validatePromoMutation.mutate(promoCode)}
                    disabled={!promoCode || validatePromoMutation.isPending}
                    className="bg-header text-white px-6 py-2 rounded font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {validatePromoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {promoResult && (
                  <div className={`mt-2 text-sm flex items-center gap-1 ${promoResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {promoResult.valid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {promoResult.message}
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal :</span>
                  <span className="font-medium">৳ {subtotal.toLocaleString('en-BD')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount :</span>
                    <span className="font-medium">-৳ {discount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>TOTAL :</span>
                    <span>৳ {total.toLocaleString('en-BD')}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">(Inclusive of all taxes)</p>
                </div>
              </div>

              <button onClick={handlePlaceOrder} className="w-full bg-header text-white py-3 rounded font-semibold hover:opacity-90">
                PLACE ORDER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-semibold">Shopping Cart</h1>
            <Link to="/">
              <X className="w-6 h-6" />
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total ({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})</span>
            <span className="text-lg font-semibold">৳ {total.toLocaleString('en-BD')}</span>
          </div>
        </div>

        {/* Mobile Cart Items */}
        {cartItems.map((item: CartItem) => (
          <div key={item.id} className="bg-white mt-2 p-4">
            <div className="flex gap-3 mb-3">
              <img
                src={getImageUrl(item.product.image, '/placeholder-product.jpg')}
                alt={item.product.name}
                className="w-24 h-24 object-contain rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{item.product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{item.variant.sku}</p>
                <p className="text-lg font-semibold">৳ {Number(item.line_total).toLocaleString('en-BD')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Qty:</span>
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => updateItemMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1 || updateItemMutation.isPending}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateItemMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={updateItemMutation.isPending}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeItemMutation.mutate(item.id)}
                disabled={removeItemMutation.isPending}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <button
              onClick={() => setShowProductDetails(showProductDetails === item.id ? null : item.id)}
              className="w-full bg-gray-100 py-3 rounded text-sm text-header font-medium flex items-center justify-center gap-2"
            >
              {showProductDetails === item.id ? 'Hide' : 'Show'} Details
              <span className="transform transition-transform" style={{transform: showProductDetails === item.id ? 'rotate(180deg)' : 'rotate(0)'}}>▼</span>
            </button>

            {showProductDetails === item.id && (
              <div className="mt-4 border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Metal:</span>
                  <span>{item.variant.metal_type} {item.variant.metal_purity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span>{item.variant.metal_color}</span>
                </div>
                {item.variant.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span>{item.variant.size}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span>{item.variant.net_weight}g</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Coupon Section */}
        <div className="bg-white mt-2 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5"/>
            <span className="font-medium">Apply Coupon Code</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoResult(null);
              }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
              placeholder="Enter coupon code"
            />
            <button
              onClick={() => promoCode && validatePromoMutation.mutate(promoCode)}
              disabled={!promoCode || validatePromoMutation.isPending}
              className="bg-header text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {validatePromoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
          {promoResult && (
            <div className={`mt-2 text-sm flex items-center gap-1 ${promoResult.valid ? 'text-green-600' : 'text-red-600'}`}>
              {promoResult.valid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {promoResult.message}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal :</span>
              <span className="font-medium">৳ {subtotal.toLocaleString('en-BD')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount :</span>
                <span className="font-medium">-৳ {discount.toLocaleString('en-BD')}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>TOTAL :</span>
              <span>৳ {total.toLocaleString('en-BD')}</span>
            </div>
            <p className="text-xs text-gray-500 text-right">(Inclusive of all taxes)</p>
          </div>

          <div className="bg-gray-50 p-3 rounded flex items-center gap-3">
            <Phone className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Any Questions?</p>
              <p className="text-sm">Please call us at <a href="tel:+912262300916" className="font-semibold">+912262300916</a></p>
            </div>
          </div>
        </div>

        {/* Promise Mobile */}
        <div className="bg-white mt-2 p-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-base font-semibold">OUR</div>
            <div className="text-base font-semibold">PR<span className="inline-flex items-center justify-center w-4 h-4 bg-header text-white rounded-full text-xs">✓</span>MISE</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {promiseFeatures.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mb-2 p-1.5">
                  <item.icon className="w-5 h-5 text-header" />
                </div>
                <p className="text-xs font-medium leading-tight">{item.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Card Options */}
        <div className="mt-4 flex gap-4 items-center justify-center flex-wrap">
          {paymentLogos.map((logo, idx) => (
            <img key={idx} src={logo.src} alt={logo.alt} className={logo.height} />
          ))}
        </div>

        {/* Mobile Place Order Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
          <button onClick={handlePlaceOrder} className="w-full bg-header text-white py-3 rounded-lg font-semibold text-lg">
            PLACE ORDER
          </button>
        </div>

        <div className="h-20"></div>
      </div>
    </div>
  );
}