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
  error: string | null
  setError: (error: string | null) => void
  successMessage: string | null
  setSuccessMessage: (message: string | null) => void
}

export function ForgotPasswordForm({
  onBackToLogin,
  error,
  setError,
  successMessage,
  setSuccessMessage,
}: ForgotPasswordFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccessMessage(null)
      setFieldErrors({})
      try {
        const response = await authApi.resendOTP({
          data: { email: value.email, type: 'PASSWORD_RESET' },
        })

        if (response.success) {
          setSuccessMessage(
            response.message || 'Password reset link sent to your email!'
          )
          form.reset()
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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="p-8 md:p-12 min-h-[500px]"
    >
      <h2 className="text-2xl font-bold mb-6">Forgot Your Password?</h2>

      <div className="mb-6">
        <p className="text-gray-700 font-semibold mb-2">
          Retrieve your password here
        </p>
        <p className="text-gray-600 mb-2">
          Please enter your email address below.
        </p>
        <p className="text-gray-600 mb-6">
          You will receive a link to reset your password.
        </p>
      </div>

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

      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => (!value ? 'Email is required' : undefined),
        }}
        children={(field) => (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Email Address<span className="text-header">*</span>
            </label>
            <input
              type="email"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }))
                }
              }}
              onBlur={field.handleBlur}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
              disabled={isPending}
            />
            <FieldError field={field} serverError={fieldErrors.email} />
          </div>
        )}
      />

      <p className="text-sm text-header mb-4">* Required Fields</p>

      <div className="mb-6">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-gray-700 hover:text-header font-medium"
        >
          &lt; Back to Login
        </button>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-12 rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'SENDING...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
