import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGiftMessageOpen, setIsGiftMessageOpen] = useState(false)
  const [shippingOption, setShippingOption] = useState('same')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('bank')
  const [mobileNumber, setMobileNumber] = useState('')

  const [formData, setFormData] = useState({
    title: 'Mr',
    firstName: 'Shuvro',
    lastName: 'Chakma',
    address: '',
    landmark: '',
    telephone: '',
    altTelephone: '',
    country: 'India',
    state: '',
    city: '',
    zipCode: '',
    recipientName: 'Shuvro Chakma',
    giftMessage: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleContinue = () => {
    if (termsAccepted) {
      setCurrentStep(2)
    }
  }

  const handleSendOTP = () => {
    // Backend will handle OTP sending
    console.log('Sending OTP to:', mobileNumber)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center flex-1">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                ✓
              </div>
              <span className="ml-2 text-green-600 font-semibold">
                Login & Register
              </span>
            </div>
          </div>

          <div className="flex-1 h-1 bg-green-600 mx-4"></div>

          <div className="flex items-center flex-1 justify-center">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${currentStep >= 1 ? 'bg-pink-700' : 'bg-gray-300'}`}
              >
                {currentStep > 1 ? '✓' : '2'}
              </div>
              <span
                className={`ml-2 font-semibold ${currentStep >= 1 ? 'text-pink-700' : 'text-gray-400'}`}
              >
                Shipping
              </span>
            </div>
          </div>

          <div
            className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-pink-700' : 'bg-gray-300'}`}
          ></div>

          <div className="flex items-center flex-1 justify-end">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${currentStep >= 2 ? 'bg-pink-700' : 'bg-gray-300'}`}
              >
                3
              </div>
              <span
                className={`ml-2 font-semibold ${currentStep >= 2 ? 'text-pink-700' : 'text-gray-400'}`}
              >
                Payment Selection
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Shipping Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">Billing Information</h2>

            <div className="mb-6">
              <span className="text-sm text-gray-700">
                Select a billing address from your address book or{' '}
              </span>
              <button className="text-pink-700 border border-pink-700 px-4 py-1 rounded text-sm font-semibold hover:bg-pink-50">
                enter a new address +
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  First Name*
                </label>
                <div className="flex gap-2">
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded px-3 py-2 w-24"
                  >
                    <option>Mr</option>
                    <option>Ms</option>
                    <option>Mrs</option>
                  </select>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Last Name*
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Address*
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full h-24 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Landmark*
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Telephone*
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center border border-gray-300 rounded px-3 py-2">
                    <span className="text-2xl">🇮🇳</span>
                    <span className="ml-2">+91</span>
                  </div>
                  <input
                    type="text"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Alternative Telephone
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center border border-gray-300 rounded px-3 py-2">
                    <span className="text-2xl">🇮🇳</span>
                    <span className="ml-2">+91</span>
                  </div>
                  <input
                    type="text"
                    name="altTelephone"
                    value={formData.altTelephone}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Country*
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                >
                  <option>India</option>
                  <option>USA</option>
                  <option>UK</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  State*
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-gray-400"
                >
                  <option value="">
                    Please select region, state or province
                  </option>
                  <option>Maharashtra</option>
                  <option>Delhi</option>
                  <option>Karnataka</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  City*
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Zip/Postal Code*
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shipping"
                    value="same"
                    checked={shippingOption === 'same'}
                    onChange={(e) => setShippingOption(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Ship to this address</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shipping"
                    value="different"
                    checked={shippingOption === 'different'}
                    onChange={(e) => setShippingOption(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Ship to different address</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-red-600">
                  I have read and agree to{' '}
                  <a href="#" className="underline">
                    terms of service
                  </a>{' '}
                  *
                </span>
              </label>
            </div>

            {/* Gift Message Section */}
            <div className="border border-gray-300 rounded-lg mb-6">
              <button
                onClick={() => setIsGiftMessageOpen(!isGiftMessageOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="flex items-center gap-2 text-pink-700 font-semibold">
                  🎁 Gift Message
                </span>
                <ChevronDown
                  className={`transform transition-transform ${isGiftMessageOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isGiftMessageOpen && (
                <div className="p-4 border-t border-gray-300">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Recipient's Name
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Gift Message
                    </label>
                    <textarea
                      name="giftMessage"
                      value={formData.giftMessage}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded px-3 py-2 w-full h-32 resize-none"
                      placeholder="Enter your gift message here..."
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">* Required Fields</span>
              <button
                onClick={handleContinue}
                disabled={!termsAccepted}
                className={`px-8 py-3 rounded font-semibold text-white ${
                  termsAccepted
                    ? 'bg-pink-700 hover:bg-pink-800'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Continue Checkout
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Selection */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

            {/* Online Payment Option */}
            <div className="border border-gray-300 rounded-lg mb-4">
              <button
                onClick={() => setPaymentMethod('online')}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                  />
                  <span className="font-semibold">
                    Online Payment (Credit / Debit / Net Banking / UPI /
                    Wallets)
                  </span>
                </div>
                <div className="flex gap-2">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect width='40' height='25' rx='3' fill='%231434CB'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='10' font-weight='bold'%3EVISA%3C/text%3E%3C/svg%3E"
                    alt="Visa"
                    className="h-6"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect width='40' height='25' rx='3' fill='%23EB001B'/%3E%3Ccircle cx='15' cy='12.5' r='7' fill='%23EB001B'/%3E%3Ccircle cx='25' cy='12.5' r='7' fill='%23FF5F00'/%3E%3C/svg%3E"
                    alt="Mastercard"
                    className="h-6"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect width='40' height='25' rx='3' fill='%23016FD0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='8' font-weight='bold'%3ERUBY%3C/text%3E%3C/svg%3E"
                    alt="RuPay"
                    className="h-6"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect width='40' height='25' rx='3' fill='%23002970'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='7' font-weight='bold'%3EMAESTRO%3C/text%3E%3C/svg%3E"
                    alt="Maestro"
                    className="h-6"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect width='40' height='25' rx='3' fill='%23006FCF'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='7' font-weight='bold'%3EAMEX%3C/text%3E%3C/svg%3E"
                    alt="Amex"
                    className="h-6"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect width='40' height='25' rx='3' fill='%2300457C'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='8' font-weight='bold'%3EDIN%3C/text%3E%3C/svg%3E"
                    alt="Diners"
                    className="h-6"
                  />
                </div>
              </button>
            </div>

            {/* Bank Transfer Option */}
            <div className="border-2 border-pink-700 rounded-lg mb-4">
              <button
                onClick={() => setPaymentMethod('bank')}
                className="w-full p-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={() => setPaymentMethod('bank')}
                  />
                  <span className="font-semibold">Bank Transfer</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 text-left">
                  Pay manually using this method on the below bank details
                </p>

                {paymentMethod === 'bank' && (
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">
                        Verification:
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        Verify your mobile number to place your order
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="+8801794213957"
                          className="border border-gray-300 rounded px-3 py-2 flex-1"
                        />
                        <button
                          onClick={handleSendOTP}
                          className="bg-pink-700 text-white px-6 py-2 rounded font-semibold hover:bg-pink-800"
                        >
                          SEND OTP
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-300 pt-4">
                      <img
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='30' viewBox='0 0 120 30'%3E%3Crect width='120' height='30' fill='%23ED232A'/%3E%3Ctext x='10' y='20' fill='white' font-size='14' font-weight='bold'%3EHDFC BANK%3C/text%3E%3C/svg%3E"
                        alt="HDFC Bank"
                        className="h-8 mb-4"
                      />

                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="font-semibold mb-1">Beneficiary Name</p>
                          <p className="text-gray-700">
                            MALABAR GOLD PVT LTD E-COMMERCE
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Bank Name</p>
                          <p className="text-gray-700">HDFC</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Account No</p>
                          <p className="text-gray-700">50200023423071</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">IFSC Code</p>
                          <p className="text-gray-700">HDFC0001357</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Branch</p>
                          <p className="text-gray-700">INDRALOK-LOKHANDWALA</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-4">
                        After Bank transfer please email us transaction ID to
                        confirm your payment. Email ID{' '}
                        <a
                          href="mailto:care.in@malabargoldanddiamonds.com"
                          className="text-blue-600 underline"
                        >
                          care.in@malabargoldanddiamonds.com
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Gift Card Option */}
            <div className="border border-gray-300 rounded-lg mb-6">
              <button
                onClick={() => setPaymentMethod('gift')}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="gift"
                    checked={paymentMethod === 'gift'}
                    onChange={() => setPaymentMethod('gift')}
                  />
                  <span className="flex items-center gap-2">
                    <span>🎁</span>
                    <span className="font-semibold">Gift Card</span>
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Redeem Malabar gift card
                </span>
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-3 rounded font-semibold border-2 border-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
              <button className="px-8 py-3 rounded font-semibold bg-pink-700 text-white hover:bg-pink-800">
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
