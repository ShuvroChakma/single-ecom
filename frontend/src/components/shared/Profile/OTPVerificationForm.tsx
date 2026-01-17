/**
 * OTP Verification Form Component
 */
import { useState, useRef, useEffect } from 'react'
import * as authApi from '@/api/auth'
import { getErrorMessage } from '@/api/client'

interface OTPVerificationFormProps {
  email: string
  onSuccess: () => void
  onBackToLogin: () => void
}

export function OTPVerificationForm({
  email,
  onSuccess,
  onBackToLogin,
}: OTPVerificationFormProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await authApi.verifyEmail({
        data: { email, otp: code },
      })

      if (response.success) {
        setSuccessMessage('Email verified successfully! Redirecting to login...')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await authApi.resendOTP({
        data: { email, type: 'EMAIL_VERIFICATION' },
      })

      if (response.success) {
        setSuccessMessage('A new OTP has been sent to your email')
        setResendCooldown(60) // 60 second cooldown
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="p-8 md:p-12 min-h-[500px]">
      <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
      <p className="text-gray-600 mb-6">
        We've sent a 6-digit verification code to{' '}
        <span className="font-medium text-gray-800">{email}</span>
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}

      {/* OTP Input */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-4">
          Enter verification code
        </label>
        <div className="flex gap-3 justify-center md:justify-start">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-header focus:ring-1 focus:ring-header disabled:bg-gray-100"
              disabled={isVerifying}
            />
          ))}
        </div>
      </div>

      {/* Verify Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isVerifying || otp.some((digit) => !digit)}
          className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-12 rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </button>
      </div>

      {/* Resend OTP */}
      <div className="mb-6">
        <p className="text-gray-600 mb-2">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={isResending || resendCooldown > 0}
          className="text-header font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          {isResending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : 'Resend OTP'}
        </button>
      </div>

      {/* Back to Login */}
      <div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-gray-700 hover:text-header font-medium"
        >
          &lt; Back to Login
        </button>
      </div>
    </div>
  )
}
