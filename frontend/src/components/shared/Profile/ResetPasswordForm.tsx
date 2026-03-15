/**
 * Reset Password Form Component
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

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

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
      setError('Please enter all 6 digits of the code.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await authApi.resetPassword({
        data: { email, otp: otpCode, new_password: newPassword },
      })

      if (response.success) {
        setSuccessMessage('Password reset successfully! Redirecting…')
        setTimeout(() => onSuccess(), 1500)
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

  const isOtpComplete = otp.every((d) => d !== '')

  return (
    <div className="p-4 sm:p-8 md:p-12 min-h-[500px] flex flex-col items-center justify-center">
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {/* Back */}
      <button
        type="button"
        onClick={onBackToForgotPassword}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-header mb-8 transition-colors"
      >
        <span>&#8592;</span> Back
      </button>

      {/* Heading */}
      <div className="mb-8">
        <p className="text-xs text-header font-semibold tracking-widest uppercase mb-2">
          Password Reset
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Set new password</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Enter the 6-digit code sent to{' '}
          <span className="font-semibold text-gray-800">{email}</span>, then choose a new password.
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Verification code</label>
        <div className="flex justify-center gap-2 sm:gap-3 mb-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isSubmitting}
              className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded transition-colors focus:outline-none
                ${digit ? 'border-header text-header' : 'border-gray-200 text-gray-900'}
                focus:border-header disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">
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

      {/* Divider */}
      <div className="border-t border-gray-100 my-6" />

      {/* New Password */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-header"
            placeholder="At least 8 characters"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 tracking-wider"
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-header"
            placeholder="Repeat your new password"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !isOtpComplete || !newPassword || !confirmPassword}
        className="w-full bg-header text-white font-semibold py-3 px-6 rounded transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
      >
        {isSubmitting ? 'Resetting…' : 'Reset Password'}
      </button>
    </form>
    </div>
  )
}
