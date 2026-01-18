/**
 * Register Form Component
 */
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import * as authApi from '@/api/auth'
import { getErrorMessage, getFieldErrors, hasFieldErrors } from '@/api/client'
import { FieldError } from './FieldError'

interface RegisterFormProps {
  onSwitchToLogin: () => void
  onSuccess: (message: string) => void
  error: string | null
  setError: (error: string | null) => void
  successMessage: string | null
}

export function RegisterForm({
  onSwitchToLogin,
  onSuccess,
  error,
  setError,
  successMessage,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      title: 'Mr',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setFieldErrors({})
      try {
        const response = await authApi.register({
          data: {
            title: value.title,
            first_name: value.first_name,
            last_name: value.last_name,
            email: value.email,
            phone: value.phone,
            password: value.password,
          },
        })

        if (response.success) {
          onSuccess(
            response.message ||
              'Registration successful! Please check your email to verify.'
          )
          form.reset()
          setTimeout(() => {
            onSwitchToLogin()
          }, 2000)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* First Name with Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            First Name<span className="text-header">*</span>
          </label>
          <div className="flex gap-2">
            <form.Field
              name="title"
              children={(field) => (
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  disabled={isPending}
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              )}
            />
            <form.Field
              name="first_name"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'First name is required' : undefined,
              }}
              children={(field) => (
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      if (fieldErrors.first_name) {
                        setFieldErrors((prev) => ({ ...prev, first_name: '' }))
                      }
                    }}
                    onBlur={field.handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    disabled={isPending}
                  />
                  <FieldError field={field} serverError={fieldErrors.first_name} />
                </div>
              )}
            />
          </div>
        </div>

        {/* Last Name */}
        <form.Field
          name="last_name"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Last name is required' : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Last Name<span className="text-header">*</span>
              </label>
              <input
                type="text"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  if (fieldErrors.last_name) {
                    setFieldErrors((prev) => ({ ...prev, last_name: '' }))
                  }
                }}
                onBlur={field.handleBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                disabled={isPending}
              />
              <FieldError field={field} serverError={fieldErrors.last_name} />
            </div>
          )}
        />

        {/* Email */}
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Email is required'
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                return 'Invalid email format'
              return undefined
            },
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
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }))
                  }
                }}
                onBlur={field.handleBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                disabled={isPending}
              />
              <FieldError field={field} serverError={fieldErrors.email} />
            </div>
          )}
        />

        {/* Phone */}
        <form.Field
          name="phone"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Phone number is required' : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Mobile No<span className="text-header">*</span>
              </label>
              <PhoneInput
                country="bd"
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value)
                  if (fieldErrors.phone_number || fieldErrors.phone) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      phone_number: '',
                      phone: '',
                    }))
                  }
                }}
                containerClass="w-full"
                inputClass="!w-full !h-[52px] !border-gray-300 focus:!border-header"
                buttonClass="!border-gray-300"
                dropdownClass="z-[9999]"
                disabled={isPending}
              />
              <FieldError
                field={field}
                serverError={fieldErrors.phone_number || fieldErrors.phone}
              />
            </div>
          )}
        />

        {/* Password */}
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Password is required'
              if (value.length < 8)
                return 'Password must be at least 8 characters'
              return undefined
            },
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

        {/* Confirm Password */}
        <form.Field
          name="confirm_password"
          validators={{
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) => {
              if (!value) return 'Please confirm password'
              if (value !== fieldApi.form.getFieldValue('password'))
                return 'Passwords do not match'
              return undefined
            },
          }}
          children={(field) => (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Confirm Password<span className="text-header">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                >
                  {showConfirmPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <FieldError field={field} />
            </div>
          )}
        />
      </div>

      <div className="flex justify-center mb-4 mt-8">
        <button
          type="submit"
          disabled={isPending}
          className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-103 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'REGISTERING...' : 'REGISTER TO CONTINUE'}
        </button>
      </div>

      <div className="text-center">
        <span className="text-gray-600">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-header font-medium hover:underline"
        >
          Log In!
        </button>
      </div>
    </form>
  )
}
