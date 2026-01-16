import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

/* =======================
   COUNTRY CODES (REAL FLAGS)
======================= */
const COUNTRY_CODES = [
  { code: '+880', country: 'Bangladesh', flag: 'https://flagcdn.com/w20/bd.png' },
  { code: '+91', country: 'India', flag: 'https://flagcdn.com/w20/in.png' },
  { code: '+1', country: 'USA', flag: 'https://flagcdn.com/w20/us.png' },
  { code: '+44', country: 'UK', flag: 'https://flagcdn.com/w20/gb.png' },
]

/* =======================
   COUNTRY CODE SELECT
======================= */
const CountryCodeSelect = ({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const selected = COUNTRY_CODES.find((c) => c.code === value)

  return (
    <div className="relative w-[90px] shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-gray-300 rounded pl-8 pr-2 py-2 bg-white w-full"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code}
          </option>
        ))}
      </select>

      {selected && (
        <img
          src={selected.flag}
          alt={selected.country}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-4 rounded-sm pointer-events-none"
        />
      )}

      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        ▾
      </span>
    </div>
  )
}

/* =======================
   PAYMENT OPTION
======================= */
const PaymentOption = ({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <div
    className={`border rounded mb-4 cursor-pointer ${
      active ? 'border-header' : 'border-gray-300'
    }`}
    onClick={onClick}
  >
    <div className="p-4 font-semibold">{title}</div>
    {active && <div className="p-4 border-t space-y-3">{children}</div>}
  </div>
)

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isGiftOpen, setIsGiftOpen] = useState(false)
  const [countryCode, setCountryCode] = useState('+880')
  const [activePayment, setActivePayment] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: 'Mr',
    firstName: '',
    lastName: '',
    address: '',
    landmark: '',
    telephone: '',
    altTelephone: '',
    city: '',
    zipCode: '',
    recipientName: '',
    giftMessage: '',
  })

  /* =======================
     HANDLERS
  ======================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const handleNewAddress = () => {
    setFormData({
      title: 'Mr',
      firstName: '',
      lastName: '',
      address: '',
      landmark: '',
      telephone: '',
      altTelephone: '',
      city: '',
      zipCode: '',
      recipientName: '',
      giftMessage: '',
    })
    setCountryCode('+880')
    setIsGiftOpen(false)
  }

  const placeOrder = () => {
    alert('✅ Your order has been placed successfully!')
  }

  return (
    <div className="bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">

        {/* =======================
            PROGRESS
        ======================= */}
        <div className="flex justify-between mb-8">
          <span className="font-semibold text-header">1. Shipping</span>
          <span
            className={`font-semibold ${
              currentStep === 2 ? 'text-header' : 'text-gray-400'
            }`}
          >
            2. Payment
          </span>
        </div>

        {/* =======================
            SHIPPING
        ======================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">Billing Information</h2>

            <button
              onClick={handleNewAddress}
              className="mb-6 text-sm font-semibold text-header border border-header px-4 py-1 rounded hover:bg-header hover:text-white"
            >
              Enter a new address +
            </button>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="flex gap-2">
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-24"
                >
                  <option>Mr</option>
                  <option>Ms</option>
                  <option>Mrs</option>
                </select>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name*"
                  className="border rounded px-3 py-2 flex-1"
                />
              </div>

              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name*"
                className="border rounded px-3 py-2"
              />
            </div>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address*"
              className="border rounded px-3 py-2 w-full h-24 mb-6"
            />

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="flex gap-2">
                <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                <input
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="Mobile Number*"
                  className="border rounded px-3 py-2 flex-1"
                />
              </div>

              <div className="flex gap-2">
                <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                <input
                  name="altTelephone"
                  value={formData.altTelephone}
                  onChange={handleChange}
                  placeholder="Alternate Mobile Number"
                  className="border rounded px-3 py-2 flex-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City*"
                className="border rounded px-3 py-2"
              />
              <input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="Zip Code*"
                className="border rounded px-3 py-2"
              />
            </div>

            {/* Gift */}
            <div className="border rounded mb-6">
              <button
                onClick={() => setIsGiftOpen(!isGiftOpen)}
                className="w-full flex justify-between p-4 font-semibold"
              >
                🎁 Gift Message
                <ChevronDown className={isGiftOpen ? 'rotate-180' : ''} />
              </button>

              {isGiftOpen && (
                <div className="p-4 border-t">
                  <input
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    placeholder="Recipient Name"
                    className="border rounded px-3 py-2 w-full mb-3"
                  />
                  <textarea
                    name="giftMessage"
                    value={formData.giftMessage}
                    onChange={handleChange}
                    placeholder="Gift Message"
                    className="border rounded px-3 py-2 w-full h-24"
                  />
                </div>
              )}
            </div>

            <label className="flex gap-2 mb-6">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="text-sm text-red-600">
                I agree to the terms & conditions *
              </span>
            </label>

            <button
              disabled={!termsAccepted}
              onClick={() => setCurrentStep(2)}
              className={`px-8 py-3 rounded text-white font-semibold ${
                termsAccepted ? 'bg-header' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* =======================
            PAYMENT
        ======================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">Payment Method</h2>

            <PaymentOption
              title="bKash"
              active={activePayment === 'bkash'}
              onClick={() => setActivePayment('bkash')}
            >
              <input className="border rounded px-3 py-2 w-full" placeholder="bKash Number" />
            </PaymentOption>

            <PaymentOption
              title="Nagad"
              active={activePayment === 'nagad'}
              onClick={() => setActivePayment('nagad')}
            >
              <input className="border rounded px-3 py-2 w-full" placeholder="Nagad Number" />
            </PaymentOption>

            <PaymentOption
              title="Rocket"
              active={activePayment === 'rocket'}
              onClick={() => setActivePayment('rocket')}
            >
              <input className="border rounded px-3 py-2 w-full" placeholder="Rocket Number" />
            </PaymentOption>

            <PaymentOption
              title="Bank Payment"
              active={activePayment === 'bank'}
              onClick={() => setActivePayment('bank')}
            >
              <p className="text-sm text-gray-600">
                Bank details will be shown after confirmation.
              </p>
            </PaymentOption>

            <PaymentOption
              title="International Card"
              active={activePayment === 'card'}
              onClick={() => setActivePayment('card')}
            >
              <input className="border rounded px-3 py-2 w-full" placeholder="Card Number" />
              <div className="grid grid-cols-2 gap-4">
                <input className="border rounded px-3 py-2" placeholder="MM / YY" />
                <input className="border rounded px-3 py-2" placeholder="CVV" />
              </div>
            </PaymentOption>

            <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-3 border rounded"
              >
                Back
              </button>
              <button
                onClick={placeOrder}
                className="px-8 py-3 bg-header text-white rounded"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Checkout
