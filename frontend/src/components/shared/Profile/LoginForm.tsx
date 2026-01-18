/**
 * Login Form Component
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getErrorMessage, getFieldErrors, hasFieldErrors } from '@/api/client'
import { FieldError } from './FieldError'

interface LoginFormProps {
  onForgotPassword: () => void
  onSwitchToRegister: () => void
  onEmailNotVerified: (email: string) => void
  error: string | null
  setError: (error: string | null) => void
  successMessage: string | null
}

export function LoginForm({
  onForgotPassword,
  onSwitchToRegister,
  onEmailNotVerified,
  error,
  setError,
  successMessage,
}: LoginFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setFieldErrors({})
      try {
        await login(value.email, value.password)
        navigate({ to: '/profile' })
      } catch (err: unknown) {
        // Check if email not verified error (AUTH_002 is the backend error code)
        const errorCode = err instanceof ApiError ? err.code : (err as { code?: string })?.code
        const errorMessage = getErrorMessage(err)

        if (errorCode === 'AUTH_002' || errorMessage.includes('verify your email')) {
          onEmailNotVerified(value.email)
          return
        }

        if (hasFieldErrors(err)) {
          setFieldErrors(getFieldErrors(err))
        } else {
          setError(errorMessage)
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
      className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => (!value ? 'Email is required' : undefined),
          }}
          children={(field) => (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address<span className="text-header">*</span>
              </label>
              <input
                type="email"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  if (fieldErrors.email || fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, email: '', username: '' }))
                  }
                }}
                onBlur={field.handleBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                disabled={isPending}
              />
              <FieldError
                field={field}
                serverError={fieldErrors.email || fieldErrors.username}
              />
            </div>
          )}
        />

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Password is required' : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Enter Password<span className="text-header">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }))
                    }
                  }}
                  onBlur={field.handleBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <FieldError field={field} serverError={fieldErrors.password} />
            </div>
          )}
        />
      </div>

      <div className="flex justify-center mb-4 lg:mt-15">
        <button
          type="submit"
          disabled={isPending}
          className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'LOGGING IN...' : 'LOGIN TO CONTINUE'}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-header font-medium hover:underline"
        >
          Forgot Password?
        </button>
      </div>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-header font-medium hover:underline"
        >
          Create New Account
        </button>
      </div>
    </form>
  )
}
