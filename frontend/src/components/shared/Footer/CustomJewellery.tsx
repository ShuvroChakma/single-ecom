import { useState } from 'react'
import type { ChangeEvent } from 'react'

interface FormData {
  name: string
  mobile: string
  email: string
  address: string
  designChoice: 'upload' | 'collection'
  comments: string
  captcha: string
  termsAccepted: boolean
  uploadedFile: File | null
}

export default function CustomJewelleryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobile: '',
    email: '',
    address: '',
    designChoice: 'upload',
    comments: '',
    captcha: '',
    termsAccepted: false,
    uploadedFile: null,
  })

  const [fileName, setFileName] = useState<string>('')
  const [captchaCode] = useState<string>(generateCaptcha())

  function generateCaptcha(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target as HTMLInputElement
    const { name, value, type, checked } = target
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
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.email ||
      !formData.address
    ) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.captcha !== captchaCode) {
      alert('Captcha does not match. Please try again.')
      return
    }

    if (!formData.termsAccepted) {
      alert('Please accept the terms and conditions')
      return
    }

    alert('Order submitted successfully! We will contact you soon.')
    console.log('Form data:', formData)
  }

  return (
    <div className="w-full bg-linear-to-b from-amber-50 to-white">
      {/* Header Image */}
      <div className="w-full h-[260px] md:h-[600px] overflow-hidden">
        <img
          src="https://static.malabargoldanddiamonds.com/media/wysiwyg/Custom-jewellery-banner-web.jpg"
          alt="Custom Jewellery"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Form Container */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address<span className="text-red-600">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              ></textarea>
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
                      Upload image of the jewellery you wish to manufacture by
                      us.
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
                    Select a design from malabargoldanddiamonds collection
                  </span>
                </label>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments /Instructions<span className="text-red-600">*</span>
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter any specific requirements or instructions..."
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

            {/* Required Fields Notice */}
            <p className="text-sm text-red-600 mt-4">* Required Fields</p>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                className="w-full md:w-auto bg-header text-white px-12 py-3 rounded-md text-lg font-semibold hover:bg-header/90 transition shadow-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
