/**
 * Login Component with TanStack Form
 * Uses server functions for authentication
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useAuth } from '@/hooks/useAuth'
import * as authApi from '@/api/auth'
import { getErrorMessage, getFieldErrors, hasFieldErrors } from '@/api/client'

function FieldError({ field, serverError }: { field: any; serverError?: string }) {
  const clientErrors = field.state.meta.isTouched && field.state.meta.errors.length
    ? field.state.meta.errors.join(', ')
    : null

  const errorMessage = serverError || clientErrors

  return errorMessage ? (
    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
  ) : null
}

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Field-specific server errors
  const [loginFieldErrors, setLoginFieldErrors] = useState<Record<string, string>>({})
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string>>({})
  const [forgotFieldErrors, setForgotFieldErrors] = useState<Record<string, string>>({})

  // Login Form
  const loginForm = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setLoginFieldErrors({})
      try {
        await login(value.email, value.password)
        navigate({ to: '/profile' })
      } catch (err) {
        if (hasFieldErrors(err)) {
          setLoginFieldErrors(getFieldErrors(err))
        } else {
          setError(getErrorMessage(err))
        }
      }
    },
  })

  // Register Form
  const registerForm = useForm({
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
      setSuccessMessage(null)
      setRegisterFieldErrors({})
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
          setSuccessMessage(response.message || 'Registration successful! Please check your email to verify.')
          registerForm.reset()
          setTimeout(() => {
            setActiveTab('login')
            setSuccessMessage(null)
          }, 2000)
        }
      } catch (err) {
        if (hasFieldErrors(err)) {
          setRegisterFieldErrors(getFieldErrors(err))
        } else {
          setError(getErrorMessage(err))
        }
      }
    },
  })

  // Forgot Password Form
  const forgotForm = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccessMessage(null)
      setForgotFieldErrors({})
      try {
        const response = await authApi.resendOTP({
          data: { email: value.email, type: 'PASSWORD_RESET' },
        })

        if (response.success) {
          setSuccessMessage(response.message || 'Password reset link sent to your email!')
          forgotForm.reset()
        }
      } catch (err) {
        if (hasFieldErrors(err)) {
          setForgotFieldErrors(getFieldErrors(err))
        } else {
          setError(getErrorMessage(err))
        }
      }
    },
  })

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setActiveTab('login')
    setError(null)
    setSuccessMessage(null)
  }

  const isLoginPending = loginForm.state.isSubmitting
  const isRegisterPending = registerForm.state.isSubmitting
  const isForgotPending = forgotForm.state.isSubmitting

  return (
    <div className="bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-md overflow-hidden">
        {!showForgotPassword ? (
          <>
            {/* Tab Headers */}
            <div className="flex relative">
              <button
                onClick={() => {
                  setActiveTab('login')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
                  activeTab === 'login'
                    ? 'bg-header text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setActiveTab('register')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
                  activeTab === 'register'
                    ? 'bg-header text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
              <div
                className={`absolute bottom-0 w-0 h-0 border-l-15 border-l-transparent border-r-15 border-r-transparent border-t-15 border-t-header transition-all duration-300 ${
                  activeTab === 'login' ? 'left-1/4' : 'left-3/4'
                } transform -translate-x-1/2 translate-y-full`}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  loginForm.handleSubmit()
                }}
                className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <loginForm.Field
                    name="email"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? 'Email is required' : undefined,
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
                            if (loginFieldErrors.email) setLoginFieldErrors(prev => ({ ...prev, email: '' }))
                          }}
                          onBlur={field.handleBlur}
                          className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                          disabled={isLoginPending}
                        />
                        <FieldError field={field} serverError={loginFieldErrors.email || loginFieldErrors.username} />
                      </div>
                    )}
                  />

                  <loginForm.Field
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
                              if (loginFieldErrors.password) setLoginFieldErrors(prev => ({ ...prev, password: '' }))
                            }}
                            onBlur={field.handleBlur}
                            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                            disabled={isLoginPending}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                          >
                            {showPassword ? 'HIDE' : 'SHOW'}
                          </button>
                        </div>
                        <FieldError field={field} serverError={loginFieldErrors.password} />
                      </div>
                    )}
                  />
                </div>

                <div className="flex justify-center mb-4 lg:mt-15">
                  <button
                    type="submit"
                    disabled={isLoginPending}
                    className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoginPending ? 'LOGGING IN...' : 'LOGIN TO CONTINUE'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-header font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-header font-medium hover:underline"
                  >
                    Create New Account
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  registerForm.handleSubmit()
                }}
                className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* First Name with Title */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      First Name<span className="text-header">*</span>
                    </label>
                    <div className="flex gap-2">
                      <registerForm.Field
                        name="title"
                        children={(field) => (
                          <select
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                            disabled={isRegisterPending}
                          >
                            <option value="Mr">Mr</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Ms">Ms</option>
                            <option value="Dr">Dr</option>
                          </select>
                        )}
                      />
                      <registerForm.Field
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
                                if (registerFieldErrors.first_name) setRegisterFieldErrors(prev => ({ ...prev, first_name: '' }))
                              }}
                              onBlur={field.handleBlur}
                              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                              disabled={isRegisterPending}
                            />
                            <FieldError field={field} serverError={registerFieldErrors.first_name} />
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <registerForm.Field
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
                            if (registerFieldErrors.last_name) setRegisterFieldErrors(prev => ({ ...prev, last_name: '' }))
                          }}
                          onBlur={field.handleBlur}
                          className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                          disabled={isRegisterPending}
                        />
                        <FieldError field={field} serverError={registerFieldErrors.last_name} />
                      </div>
                    )}
                  />

                  {/* Email */}
                  <registerForm.Field
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
                            if (registerFieldErrors.email) setRegisterFieldErrors(prev => ({ ...prev, email: '' }))
                          }}
                          onBlur={field.handleBlur}
                          className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                          disabled={isRegisterPending}
                        />
                        <FieldError field={field} serverError={registerFieldErrors.email} />
                      </div>
                    )}
                  />

                  {/* Phone */}
                  <registerForm.Field
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
                            if (registerFieldErrors.phone_number) setRegisterFieldErrors(prev => ({ ...prev, phone_number: '' }))
                          }}
                          containerClass="w-full"
                          inputClass="!w-full !h-[52px] !border-gray-300 focus:!border-header"
                          buttonClass="!border-gray-300"
                          dropdownClass="z-[9999]"
                          disabled={isRegisterPending}
                        />
                        <FieldError field={field} serverError={registerFieldErrors.phone_number || registerFieldErrors.phone} />
                      </div>
                    )}
                  />

                  {/* Password */}
                  <registerForm.Field
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
                              if (registerFieldErrors.password) setRegisterFieldErrors(prev => ({ ...prev, password: '' }))
                            }}
                            onBlur={field.handleBlur}
                            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                            disabled={isRegisterPending}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                          >
                            {showPassword ? 'HIDE' : 'SHOW'}
                          </button>
                        </div>
                        <FieldError field={field} serverError={registerFieldErrors.password} />
                      </div>
                    )}
                  />

                  {/* Confirm Password */}
                  <registerForm.Field
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
                            disabled={isRegisterPending}
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
                    disabled={isRegisterPending}
                    className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-103 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegisterPending ? 'REGISTERING...' : 'REGISTER TO CONTINUE'}
                  </button>
                </div>

                <div className="text-center">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-header font-medium hover:underline"
                  >
                    Log In!
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* Forgot Password Form */
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              forgotForm.handleSubmit()
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

            <forgotForm.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Email is required' : undefined,
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
                      if (forgotFieldErrors.email) setForgotFieldErrors(prev => ({ ...prev, email: '' }))
                    }}
                    onBlur={field.handleBlur}
                    className="w-full max-w-md px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                    disabled={isForgotPending}
                  />
                  <FieldError field={field} serverError={forgotFieldErrors.email} />
                </div>
              )}
            />

            <p className="text-sm text-header mb-4">* Required Fields</p>

            <div className="mb-6">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-gray-700 hover:text-header font-medium"
              >
                &lt; Back to Login
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isForgotPending}
                className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-12 rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isForgotPending ? 'SENDING...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
