import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { submitCustomJewelleryRequest } from '@/api/inquiries'
import { getSlides } from '@/api/slides'
import { SLIDE_POSITIONS } from '@/api/slidePositions'
import { getImageUrl } from '@/api/client'

const FALLBACK_BANNER = ''

interface FormData {
  name: string
  mobile: string
  email: string
  metalType: string
  budgetRange: string
  designChoice: 'upload' | 'collection'
  comments: string
  captcha: string
  website: string  // honeypot — must stay empty
  termsAccepted: boolean
  uploadedFile: File | null
}

const METAL_TYPES = ['Gold', 'Silver', 'Platinum', 'Diamond', 'White Gold', 'Rose Gold']
const BUDGET_RANGES = [
  'Under ৳10,000',
  '৳10,000 – ৳25,000',
  '৳25,000 – ৳50,000',
  '৳50,000 – ৳1,00,000',
  '৳1,00,000 – ৳2,50,000',
  'Above ৳2,50,000',
]

export default function CustomJewelleryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobile: '',
    email: '',
    metalType: '',
    budgetRange: '',
    designChoice: 'upload',
    comments: '',
    captcha: '',
    website: '',  // honeypot
    termsAccepted: false,
    uploadedFile: null,
  })

  const { data: bannerData } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.CUSTOM_JEWELLERY_BANNER],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.CUSTOM_JEWELLERY_BANNER } }),
    staleTime: 5 * 60 * 1000,
  })

  const bannerImage =
    bannerData?.success && bannerData.data.length > 0
      ? getImageUrl(bannerData.data[0].image_url, FALLBACK_BANNER)
      : FALLBACK_BANNER

  const [fileName, setFileName] = useState<string>('')
  const [captchaCode, setCaptchaCode] = useState<string>(generateCaptcha())
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  function generateCaptcha(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const submitMutation = useMutation({
    mutationFn: () => submitCustomJewelleryRequest({
      name: formData.name,
      email: formData.email,
      phone: formData.mobile,
      metal_type: formData.metalType,
      budget_range: formData.budgetRange,
      message: formData.comments,
      website: formData.website,
      design_image: formData.uploadedFile || undefined,
    }),
    onSuccess: (response) => {
      if (response.success) {
        setSubmitStatus('success')
        // Reset form
        setFormData({
          name: '',
          mobile: '',
          email: '',
          metalType: '',
          budgetRange: '',
          designChoice: 'upload',
          comments: '',
          captcha: '',
          website: '',
          termsAccepted: false,
          uploadedFile: null,
        })
        setFileName('')
        setCaptchaCode(generateCaptcha())
      } else {
        setSubmitStatus('error')
        setErrorMessage(response.message || 'Failed to submit request')
      }
    },
    onError: (error: any) => {
      setSubmitStatus('error')
      setErrorMessage(error.message || 'Failed to submit request. Please try again.')
    },
  })

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement
    const { name, value, type } = target
    const checked = type === 'checkbox' ? (target).checked : false
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setFormData((prev) => ({ ...prev, uploadedFile: file }))
    }
  }

  const handleSubmit = () => {
    setSubmitStatus('idle')
    setErrorMessage('')

    if (!formData.name || !formData.mobile || !formData.email) {
      setSubmitStatus('error')
      setErrorMessage('Please fill in all required fields')
      return
    }

    if (!formData.metalType || !formData.budgetRange) {
      setSubmitStatus('error')
      setErrorMessage('Please select metal type and budget range')
      return
    }

    if (!formData.comments) {
      setSubmitStatus('error')
      setErrorMessage('Please provide your design requirements or instructions')
      return
    }

    if (formData.captcha !== captchaCode) {
      setSubmitStatus('error')
      setErrorMessage('Captcha does not match. Please try again.')
      setCaptchaCode(generateCaptcha())
      return
    }

    if (!formData.termsAccepted) {
      setSubmitStatus('error')
      setErrorMessage('Please accept the terms and conditions')
      return
    }

    submitMutation.mutate()
  }

  return (
    <div className="w-full bg-linear-to-b from-amber-50 to-white">
      {/* Header Image */}
      <div className="w-full h-[260px] md:h-[600px] overflow-hidden">
        <img
          src={bannerImage}
          alt="Custom Jewellery"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Form Container */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-800">Request Submitted Successfully!</p>
                <p className="text-sm text-green-600">Our team will contact you soon to discuss your custom jewellery requirements.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Contact Details Section */}
          <div className="border-l-4 border-header bg-linear-to-r from-amber-100 to-amber-50 p-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Provide Your Contact Details
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name<span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number<span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email<span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metal Type<span className="text-red-600">*</span>
              </label>
              <select
                name="metalType"
                value={formData.metalType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select Metal Type</option>
                {METAL_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range<span className="text-red-600">*</span>
              </label>
              <select
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select Budget Range</option>
                {BUDGET_RANGES.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Design Selection Section */}
          <div className="border-l-4 border-header bg-linear-to-r from-amber-100 to-amber-50 p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800">
              How would you like to provide the design?
            </h3>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Upload Design Option */}
              <div className="flex-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="designChoice"
                    value="upload"
                    checked={formData.designChoice === 'upload'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-header focus:ring-header"
                  />
                  <span className="font-medium text-gray-800">
                    Upload my design
                  </span>
                </label>

                {formData.designChoice === 'upload' && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Upload image of the jewellery you wish to manufacture by us.
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        id="fileUpload"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*"
                      />
                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer inline-block bg-header text-white px-6 py-2 rounded-md hover:bg-header/90 transition"
                      >
                        Browse to upload
                      </label>
                      {fileName && (
                        <p className="mt-3 text-sm text-green-600">
                          Selected: {fileName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Or Divider */}
              <div className="flex items-center justify-center">
                <span className="text-gray-500 font-semibold">Or</span>
              </div>

              {/* Select from Collection Option */}
              <div className="flex-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="designChoice"
                    value="collection"
                    checked={formData.designChoice === 'collection'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-header focus:ring-header"
                  />
                  <span className="font-medium text-gray-800">
                    Describe your design in comments below
                  </span>
                </label>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design Requirements / Instructions<span className="text-red-600">*</span>
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Describe your custom jewellery requirements, preferred design, size, occasion, etc..."
              ></textarea>
            </div>

            {/* Captcha Section */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please type the letters below
                <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="bg-linear-to-r from-gray-200 to-gray-300 px-6 py-3 rounded-md border-2 border-gray-400">
                  <span
                    className="text-2xl font-bold text-gray-800 tracking-wider select-none"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {captchaCode}
                  </span>
                </div>
                <input
                  type="text"
                  name="captcha"
                  value={formData.captcha}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter captcha"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Note: Captcha is case sensitive.
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-purple-800 focus:ring-purple-500 rounded"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Terms and Conditions<span className="text-red-600">*</span>
                  </span>
                  <br />
                  You agree to not send us copyright designs. You may use these
                  designs as inspirations and we can help you design a
                  completely unique jewellery piece.
                </span>
              </label>
            </div>

            {/* Honeypot — hidden from humans, bots fill it */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Required Fields Notice */}
            <p className="text-sm text-red-600 mt-4">* Required Fields</p>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full md:w-auto bg-header text-white px-12 py-3 rounded-md text-lg font-semibold hover:bg-header/90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
