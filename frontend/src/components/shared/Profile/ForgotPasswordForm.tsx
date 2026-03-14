/**
 * Forgot Password Form Component
 */
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import * as authApi from '@/api/auth'
import { getErrorMessage, getFieldErrors, hasFieldErrors } from '@/api/client'
import { FieldError } from './FieldError'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
  onOTPSent: (email: string) => void
  error: string | null
  setError: (error: string | null) => void
  successMessage: string | null
  setSuccessMessage: (message: string | null) => void
}

export function ForgotPasswordForm({
  onBackToLogin,
  onOTPSent,
  error,
  setError,
  successMessage,
  setSuccessMessage,
}: ForgotPasswordFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccessMessage(null)
      setFieldErrors({})
      try {
        const response = await authApi.resendOTP({
          data: { email: value.email, type: 'PASSWORD_RESET' },
        })
        if (response.success) {
          const submittedEmail = value.email
          setSuccessMessage(response.message || 'OTP sent to your email.')
          form.reset()
          setTimeout(() => onOTPSent(submittedEmail), 1000)
        }
      } catch (err) {
        if (hasFieldErrors(err)) {
          setFieldErrors(getFieldErrors(err))
        } else {
          setError(getErrorMessage(err))
        }
      }
    },
  })

  const isPending = form.state.isSubmitting

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
            Account Recovery
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Forgot your password?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Enter your email address and we'll send you a code to reset your password.
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

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => (!value ? 'Email is required' : undefined),
            }}
            children={(field) => (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  onBlur={field.handleBlur}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-header"
                  disabled={isPending}
                />
                <FieldError field={field} serverError={fieldErrors.email} />
              </div>
            )}
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-header text-white font-semibold py-3 px-6 rounded transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            {isPending ? 'Sending…' : 'Send Reset Code'}
          </button>
        </form>
      </div>
    </div>
  )
}
