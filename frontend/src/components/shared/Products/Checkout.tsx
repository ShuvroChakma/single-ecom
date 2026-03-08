import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, ChevronDown, Loader2, MapPin, Plus, CreditCard, Truck, ShoppingBag, Search, X, Gift } from 'lucide-react'
import { getCart, validatePromoCode } from '@/api/cart'
import { validateGiftCard, type GiftCardValidationResult } from '@/api/gift-cards'
import { createOrder, type CreateOrderRequest } from '@/api/orders'
import { getAddresses, createAddress, type Address, type AddressCreateRequest } from '@/api/addresses'
import { getDeliveryZones, calculateDeliveryCharge, type DeliveryZone, type DeliveryChargeResponse } from '@/api/delivery'
import { getPaymentMethods, getPaymentLogo, type PaymentMethod } from '@/api/payments'
import { getImageUrl } from '@/api/client'


// Searchable Select component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  required,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left transition-colors
          ${open ? 'border-header ring-2 ring-header/20' : 'border-gray-300 hover:border-gray-400'}
          ${!selected ? 'text-gray-400' : 'text-gray-900'}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm outline-none placeholder-gray-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 text-center">No results found</li>
            ) : (
              filtered.map(opt => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors
                      ${opt.value === value ? 'bg-header/5 text-header font-medium' : 'text-gray-700'}`}
                  >
                    {opt.label}
                    {opt.value === value && <Check className="w-4 h-4 text-header" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// Step indicator component
const StepIndicator = ({ step, currentStep, label }: { step: number; currentStep: number; label: string }) => {
  const isCompleted = currentStep > step
  const isActive = currentStep === step

  return (
    <div className="flex items-center">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
        ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-header text-white' : 'bg-gray-200 text-gray-500'}
      `}>
        {isCompleted ? <Check size={16} /> : step}
      </div>
      <span className={`ml-2 text-sm ${isActive ? 'text-header font-semibold' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}

// Address card component
const AddressCard = ({
  address,
  selected,
  onSelect
}: {
  address: Address
  selected: boolean
  onSelect: () => void
}) => (
  <div
    onClick={onSelect}
    className={`
      p-4 border-2 rounded-lg cursor-pointer transition-all
      ${selected ? 'border-header bg-header/5' : 'border-gray-200 hover:border-gray-300'}
    `}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-semibold text-header bg-header/10 px-2 py-0.5 rounded">
        {address.label}
      </span>
      {address.is_default && (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Default</span>
      )}
    </div>
    <p className="font-medium">{address.full_name}</p>
    <p className="text-sm text-gray-600">{address.phone}</p>
    <p className="text-sm text-gray-600 mt-1">
      {address.address_line1}
      {address.address_line2 && `, ${address.address_line2}`}
    </p>
    <p className="text-sm text-gray-600">
      {address.city}, {address.district}
      {address.postal_code && ` - ${address.postal_code}`}
    </p>
  </div>
)

// Add address form component
const AddAddressForm = ({
  onSave,
  onCancel,
  isLoading,
  zones = []
}: {
  onSave: (data: AddressCreateRequest) => void
  onCancel: () => void
  isLoading: boolean
  zones: DeliveryZone[]
}) => {
  const [formData, setFormData] = useState<AddressCreateRequest>({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    postal_code: '',
    country: 'Bangladesh',
    is_default: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-4">Add New Address</h3>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Label</label>
          <SearchableSelect
            options={[
              { value: 'Home', label: 'Home' },
              { value: 'Office', label: 'Office' },
              { value: 'Other', label: 'Other' },
            ]}
            value={formData.label}
            onChange={v => setFormData(prev => ({ ...prev, label: v }))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Enter full name"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone *</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Delivery Area *</label>
          <SearchableSelect
            options={zones.filter(z => !z.districts.includes('*')).map(z => ({ value: z.name, label: z.name }))}
            value={formData.district}
            onChange={v => setFormData(prev => ({ ...prev, district: v }))}
            placeholder="Select delivery area"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Address *</label>
        <textarea
          name="address_line1"
          value={formData.address_line1}
          onChange={handleChange}
          required
          rows={2}
          className="w-full border rounded px-3 py-2"
          placeholder="House/Flat No., Street, Area"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">City *</label>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Enter city"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
          <input
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          name="is_default"
          checked={formData.is_default}
          onChange={handleChange}
        />
        <span className="text-sm">Set as default address</span>
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-header text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          Save Address
        </button>
      </div>
    </form>
  )
}

// Payment method card
const PaymentMethodCard = ({
  method,
  selected,
  onSelect
}: {
  method: PaymentMethod
  selected: boolean
  onSelect: () => void
}) => (
  <div
    onClick={onSelect}
    className={`
      p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-4
      ${selected ? 'border-header bg-header/5' : 'border-gray-200 hover:border-gray-300'}
    `}
  >
    <img
      src={getPaymentLogo(method)}
      alt={method.name}
      className="w-12 h-12 object-contain"
    />
    <div className="flex-1">
      <p className="font-medium">{method.name}</p>
      {method.description && (
        <p className="text-sm text-gray-500">{method.description}</p>
      )}
    </div>
    <div className={`w-5 h-5 rounded-full border-2 ${selected ? 'border-header bg-header' : 'border-gray-300'}`}>
      {selected && <Check size={14} className="text-white m-0.5" />}
    </div>
  </div>
)

const Checkout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<{ type: string; value: number; amount: number } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCardValidationResult | null>(null)
  const [giftCardError, setGiftCardError] = useState('')
  const [notes, setNotes] = useState('')
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; orderId: string } | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryChargeResponse | null>(null)

  // Fetch cart
  const { data: cartResponse, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(),
  })
  const cart = cartResponse?.data

  // Fetch addresses
  const { data: addressResponse, isLoading: addressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
  })
  const addresses = addressResponse?.data?.addresses || []

  // Fetch delivery zones
  const { data: zonesResponse } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => getDeliveryZones(),
  })
  const deliveryZones = zonesResponse?.data || []

  // Fetch payment methods
  const { data: paymentResponse, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-methods', cart?.total],
    queryFn: () => getPaymentMethods({ data: { order_amount: cart?.total } }),
    enabled: !!cart,
  })
  const paymentMethods = paymentResponse?.data?.methods || []

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.is_default)
      setSelectedAddressId(defaultAddr?.id || addresses[0].id)
    }
  }, [addresses, selectedAddressId])

  // Auto-select COD as default payment
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      const cod = paymentMethods.find(p => p.code === 'cod')
      setSelectedPaymentMethod(cod?.code || paymentMethods[0].code)
    }
  }, [paymentMethods, selectedPaymentMethod])

  // Calculate delivery when address changes
  useEffect(() => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId)
    if (selectedAddress && cart) {
      calculateDeliveryCharge({ data: { district: selectedAddress.district, order_amount: cart.subtotal } })
        .then(res => {
          if (res.success) {
            setDeliveryInfo(res.data)
          }
        })
        .catch(() => {
          // Default delivery if calculation fails
          setDeliveryInfo({
            zone_name: 'Standard',
            charge_type: 'fixed',
            base_charge: 60,
            weight_charge: 0,
            total_charge: 60,
            is_free: false,
            free_above: null,
            estimated_days: '3-5 days'
          })
        })
    }
  }, [selectedAddressId, addresses, cart])

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: (data: AddressCreateRequest) => createAddress({ data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      if (response.data) {
        setSelectedAddressId(response.data.id)
      }
      setShowAddForm(false)
    },
  })

  // Validate promo mutation
  const validatePromoMutation = useMutation({
    mutationFn: (code: string) => validatePromoCode({ data: { code, order_amount: cart?.subtotal || 0 } }),
    onSuccess: (response) => {
      if (response.success && response.data?.valid) {
        setPromoDiscount({
          type: response.data.discount_type,
          value: response.data.discount_value,
          amount: response.data.discount_amount,
        })
        setPromoError('')
      } else {
        setPromoError(response.data?.message || 'Invalid promo code')
        setPromoDiscount(null)
      }
    },
    onError: () => {
      setPromoError('Failed to validate promo code')
      setPromoDiscount(null)
    },
  })

  // Validate gift card mutation
  const validateGiftCardMutation = useMutation({
    mutationFn: (code: string) => validateGiftCard({ data: { code } }),
    onSuccess: (response) => {
      if (response.success && response.data?.valid) {
        setAppliedGiftCard(response.data)
        setGiftCardError('')
      } else {
        setGiftCardError(response.data?.message || 'Invalid gift card code')
        setAppliedGiftCard(null)
      }
    },
    onError: () => {
      setGiftCardError('Failed to validate gift card')
      setAppliedGiftCard(null)
    },
  })

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder({ data }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ['cart'] })
        setOrderSuccess({
          orderNumber: response.data.order_number,
          orderId: response.data.order_id,
        })
      }
    },
  })

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      validatePromoMutation.mutate(promoCode.trim())
    }
  }

  const handleApplyGiftCard = () => {
    if (giftCardCode.trim()) {
      validateGiftCardMutation.mutate(giftCardCode.trim())
    }
  }

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null)
    setGiftCardCode('')
    setGiftCardError('')
  }

  const handlePlaceOrder = () => {
    if (!selectedAddressId || !selectedPaymentMethod) return

    const orderData: CreateOrderRequest = {
      address_id: selectedAddressId,
      payment_method: selectedPaymentMethod,
      is_gift: isGift,
      gift_message: isGift ? giftMessage : undefined,
      promo_code: promoDiscount ? promoCode : undefined,
      gift_card_code: appliedGiftCard ? giftCardCode : undefined,
      notes: notes || undefined,
    }

    createOrderMutation.mutate(orderData)
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)
  const deliveryCharge = Number(deliveryInfo?.total_charge || 0)
  const discount = Number(promoDiscount?.amount || 0)
  const subtotal = Number(cart?.subtotal || 0)
  const giftCardDiscount = appliedGiftCard
    ? Math.min(Number(appliedGiftCard.remaining_balance), subtotal + deliveryCharge - discount)
    : 0
  const grandTotal = subtotal + deliveryCharge - discount - giftCardDiscount

  // Order success view
  if (orderSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your order number is: <strong className="text-header">{orderSuccess.orderNumber}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A confirmation has been sent to your email. We'll keep you updated on your order status.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate({ to: `/orders/${orderSuccess.orderId}` })}
                className="px-6 py-3 border border-header text-header rounded font-semibold hover:bg-header/5"
              >
                View Order
              </button>
              <button
                onClick={() => navigate({ to: '/' })}
                className="px-6 py-3 bg-header text-white rounded font-semibold hover:opacity-90"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (cartLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-header" size={40} />
      </div>
    )
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <ShoppingBag className="mx-auto text-gray-300 mb-4" size={80} />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some products to proceed with checkout</p>
          <button
            onClick={() => navigate({ to: '/products' })}
            className="px-6 py-3 bg-header text-white rounded font-semibold hover:opacity-90"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center max-w-xl mx-auto">
            <StepIndicator step={1} currentStep={currentStep} label="Address" />
            <ChevronRight className="text-gray-300" size={20} />
            <StepIndicator step={2} currentStep={currentStep} label="Payment" />
            <ChevronRight className="text-gray-300" size={20} />
            <StepIndicator step={3} currentStep={currentStep} label="Review" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="text-header" size={24} />
                  <h2 className="text-xl font-bold">Delivery Address</h2>
                </div>

                {addressLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-header" size={32} />
                  </div>
                ) : (
                  <>
                    {addresses.length > 0 && !showAddForm && (
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {addresses.map(addr => (
                          <AddressCard
                            key={addr.id}
                            address={addr}
                            selected={selectedAddressId === addr.id}
                            onSelect={() => setSelectedAddressId(addr.id)}
                          />
                        ))}
                      </div>
                    )}

                    {showAddForm ? (
                      <AddAddressForm
                        onSave={(data) => createAddressMutation.mutate(data)}
                        onCancel={() => setShowAddForm(false)}
                        isLoading={createAddressMutation.isPending}
                        zones={deliveryZones}
                      />
                    ) : (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 text-header hover:underline"
                      >
                        <Plus size={18} />
                        Add New Address
                      </button>
                    )}
                  </>
                )}

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedAddressId}
                    className="px-8 py-3 bg-header text-white rounded font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="text-header" size={24} />
                  <h2 className="text-xl font-bold">Payment Method</h2>
                </div>

                {/* Delivery Info */}
                {deliveryInfo && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="text-blue-600" size={20} />
                      <span className="font-medium">Delivery to {selectedAddress?.district}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {deliveryInfo.is_free ? (
                        <span className="text-green-600 font-medium">Free Delivery!</span>
                      ) : (
                        <span>Delivery Charge: ৳{deliveryInfo.total_charge}</span>
                      )}
                      <span className="ml-2">• Estimated: {deliveryInfo.estimated_days}</span>
                    </p>
                  </div>
                )}

                {paymentLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-header" size={32} />
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map(method => (
                      <PaymentMethodCard
                        key={method.code}
                        method={method}
                        selected={selectedPaymentMethod === method.code}
                        onSelect={() => setSelectedPaymentMethod(method.code)}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border rounded font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!selectedPaymentMethod}
                    className="px-8 py-3 bg-header text-white rounded font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-6">Review Your Order</h2>

                {/* Delivery Address */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin size={18} />
                    Delivery Address
                  </h3>
                  {selectedAddress && (
                    <div className="text-sm text-gray-600 pl-6">
                      <p className="font-medium text-gray-900">{selectedAddress.full_name}</p>
                      <p>{selectedAddress.phone}</p>
                      <p>{selectedAddress.address_line1}</p>
                      <p>{selectedAddress.city}, {selectedAddress.district}</p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard size={18} />
                    Payment Method
                  </h3>
                  <p className="text-sm text-gray-600 pl-6">
                    {paymentMethods.find(p => p.code === selectedPaymentMethod)?.name || selectedPaymentMethod}
                  </p>
                </div>

                {/* Cart Items */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag size={18} />
                    Items ({cart.item_count})
                  </h3>
                  <div className="space-y-3 pl-6">
                    {cart.items.map(item => (
                      <div key={item.id} className="flex gap-3 text-sm">
                        <img
                          src={getImageUrl(item.product.image, '/placeholder-product.jpg')}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-gray-500">
                            {item.variant.metal_type} {item.variant.metal_purity}
                            {item.variant.size && ` • Size ${item.variant.size}`}
                          </p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">৳{Number(item.line_total).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Promo Code</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 border rounded px-3 py-2"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || validatePromoMutation.isPending}
                      className="px-4 py-2 bg-header text-white rounded disabled:opacity-50"
                    >
                      {validatePromoMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-sm mt-1">{promoError}</p>}
                  {promoDiscount && (
                    <p className="text-green-600 text-sm mt-1">
                      Promo applied! You save ৳{promoDiscount.amount}
                    </p>
                  )}
                </div>

                {/* Gift Card */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Gift size={18} />
                    Gift Card
                  </h3>
                  {appliedGiftCard ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{giftCardCode}</p>
                          <p className="text-xs text-green-600">
                            Balance: ৳{Number(appliedGiftCard.remaining_balance).toLocaleString()}
                            {appliedGiftCard.expires_at && (
                              <span className="ml-2">
                                • Expires: {new Date(appliedGiftCard.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveGiftCard}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-3"
                        aria-label="Remove gift card"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          placeholder="Enter gift card code"
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <button
                          onClick={handleApplyGiftCard}
                          disabled={!giftCardCode.trim() || validateGiftCardMutation.isPending}
                          className="px-4 py-2 bg-header text-white rounded disabled:opacity-50"
                        >
                          {validateGiftCardMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {giftCardError && <p className="text-red-500 text-sm mt-1">{giftCardError}</p>}
                    </>
                  )}
                </div>

                {/* Gift Option */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                    />
                    <span>This is a gift</span>
                  </label>
                  {isGift && (
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Add a gift message (optional)"
                      rows={2}
                      className="w-full border rounded px-3 py-2 mt-2"
                    />
                  )}
                </div>

                {/* Order Notes */}
                <div className="mb-6">
                  <label className="block font-semibold mb-2">Order Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for your order?"
                    rows={2}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="mt-6 pt-6 border-t flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border rounded font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={createOrderMutation.isPending}
                    className="flex-1 px-8 py-3 bg-header text-white rounded font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order • ৳${grandTotal.toLocaleString()}`
                    )}
                  </button>
                </div>

                {createOrderMutation.isError && (
                  <p className="text-red-500 text-sm mt-4 text-center">
                    {(createOrderMutation.error as any)?.message || 'Failed to place order. Please try again.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                {cart.items.slice(0, 3).map(item => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <img
                      src={getImageUrl(item.product.image, '/placeholder-product.jpg')}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <p className="text-sm text-gray-500">+{cart.items.length - 3} more items</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>৳{Number(cart.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span>
                    {deliveryInfo?.is_free ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `৳${deliveryCharge}`
                    )}
                  </span>
                </div>
                {promoDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-৳{promoDiscount.amount}</span>
                  </div>
                )}
                {appliedGiftCard && giftCardDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Gift Card</span>
                    <span>-৳{giftCardDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-header">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
