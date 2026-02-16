/**
 * Reset Password Form Component
 * Allows user to enter OTP and new password to reset their password
 */
import { useState, useRef, useEffect } from 'react'
import * as authApi from '@/api/auth'
import { getErrorMessage } from '@/api/client'

interface ResetPasswordFormProps {
  email: string
  onSuccess: () => void
  onBackToForgotPassword: () => void
}

export function ResetPasswordForm({
  email,
  onSuccess,
  onBackToForgotPassword,
}: ResetPasswordFormProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await authApi.resetPassword({
        data: { email, otp: otpCode, new_password: newPassword },
      })

      if (response.success) {
        setSuccessMessage('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await authApi.resendOTP({
        data: { email, type: 'PASSWORD_RESET' },
      })

      if (response.success) {
        setSuccessMessage('A new OTP has been sent to your email')
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

  return (
    <form onSubmit={handleSubmit} className="p-8 md:p-12 min-h-[500px]">
      <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
      <p className="text-gray-600 mb-6">
        Enter the 6-digit code sent to{' '}
        <span className="font-medium text-gray-800">{email}</span> and your new password.
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
          Verification Code<span className="text-header">*</span>
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
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-header focus:ring-1 focus:ring-header disabled:bg-gray-100"
              disabled={isSubmitting}
            />
          ))}
        </div>
      </div>

      {/* New Password */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          New Password<span className="text-header">*</span>
        </label>
        <div className="relative max-w-md">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
            placeholder="At least 8 characters"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Confirm Password<span className="text-header">*</span>
        </label>
        <div className="relative max-w-md">
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
            placeholder="Repeat your new password"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="mb-6">
        <button
          type="submit"
          disabled={isSubmitting || otp.some((digit) => !digit) || !newPassword || !confirmPassword}
          className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-12 rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
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

      {/* Back Link */}
      <div>
        <button
          type="button"
          onClick={onBackToForgotPassword}
          className="text-gray-700 hover:text-header font-medium"
        >
          &lt; Back
        </button>
      </div>
    </form>
  )
}
