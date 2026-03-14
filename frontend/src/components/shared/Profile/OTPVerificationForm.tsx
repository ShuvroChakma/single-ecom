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

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
      setError('Please enter all 6 digits.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await authApi.verifyEmail({
        data: { email, otp: code },
      })

      if (response.success) {
        setSuccessMessage('Email verified successfully!')
        setTimeout(() => onSuccess(), 1500)
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
        setSuccessMessage('A new code has been sent to your email.')
        setResendCooldown(60)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  const isComplete = otp.every((d) => d !== '')

  return (
    <div className="p-8 md:p-12 min-h-[500px] flex flex-col items-center justify-center">
    <div className="w-full max-w-md">
      {/* Back */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-header mb-8 transition-colors"
      >
        <span>&#8592;</span> Back to Login
      </button>

      {/* Heading */}
      <div className="mb-8">
        <p className="text-xs text-header font-semibold tracking-widest uppercase mb-2">
          Email Verification
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Enter verification code</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-gray-800">{email}</span>.
          <br />
          The code expires in 10 minutes.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 px-4 py-3 bg-green-50 border-l-4 border-green-500 rounded">
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}

      {/* OTP inputs */}
      <div className="mb-8">
        <div className="flex gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isVerifying}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded transition-colors focus:outline-none
                ${digit ? 'border-header text-header' : 'border-gray-200 text-gray-900'}
                focus:border-header disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>
      </div>

      {/* Verify button */}
      <button
        type="button"
        onClick={() => handleVerify()}
        disabled={isVerifying || !isComplete}
        className="w-full bg-header text-white font-semibold py-3 px-6 rounded transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 mb-6"
      >
        {isVerifying ? 'Verifying…' : 'Verify Email'}
      </button>

      {/* Resend */}
      <p className="text-sm text-gray-500">
        Didn't receive the code?{' '}
        {resendCooldown > 0 ? (
          <span className="text-gray-400">Resend in {resendCooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-header font-medium hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </div>
    </div>
  )
}
