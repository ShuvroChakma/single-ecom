/**
 * Login Component with Authentication
 * Path: src/components/shared/Profile/Login.tsx
 * Following admin structure pattern
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useAuth } from '@/hooks/useAuth'
import * as authApi from '@/api/auth'
import { getErrorMessage } from '@/api/client'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [title, setTitle] = useState('Mr')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')

  const handleLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (!loginEmail || !loginPassword) {
        setError('Please fill in all fields')
        return
      }

      await login(loginEmail, loginPassword)

      // Redirect to profile after successful login
      navigate({ to: '/profile' })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      // Validation
      if (
        !title ||
        !firstName ||
        !lastName ||
        !registerEmail ||
        !phone ||
        !registerPassword ||
        !confirmPassword
      ) {
        setError('Please fill in all fields')
        return
      }

      if (registerPassword !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (registerPassword.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }

      const response = await authApi.register({
        title,
        first_name: firstName,
        last_name: lastName,
        email: registerEmail,
        phone,
        password: registerPassword,
      })

      if (response.success) {
        setSuccessMessage(
          response.message || 'Registration successful! Please login.'
        )
        // Clear form
        setTitle('Mr')
        setFirstName('')
        setLastName('')
        setRegisterEmail('')
        setPhone('')
        setRegisterPassword('')
        setConfirmPassword('')

        // Switch to login tab after 2 seconds
        setTimeout(() => {
          setActiveTab('login')
          setSuccessMessage(null)
        }, 2000)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setError(null)
    setShowForgotPassword(true)
  }

  const handleForgotPasswordSubmit = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      if (!forgotEmail) {
        setError('Please enter your email address')
        return
      }

      // Call resend OTP endpoint
      const response = await authApi.resendOTP(forgotEmail)

      if (response.success) {
        setSuccessMessage(
          response.message || 'Password reset link sent to your email!'
        )
        setForgotEmail('')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setActiveTab('login')
    setError(null)
    setSuccessMessage(null)
  }

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
              {/* Arrow indicator */}
              <div
                className={`absolute bottom-0 w-0 h-0 border-l-15 border-l-transparent border-r-15 border-r-transparent border-t-15 border-t-header transition-all duration-300 ${
                  activeTab === 'login' ? 'left-1/4' : 'left-3/4'
                } transform -translate-x-1/2 translate-y-full`}
              ></div>
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
              <div className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Email Address */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Email Address<span className="text-header">*</span>
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Enter Password<span className="text-header">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Login Button */}
                <div className="flex justify-center mb-4 lg:mt-15">
                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'LOGGING IN...' : 'LOGIN TO CONTINUE'}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-header font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Create New Account */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-header font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Create New Account
                  </button>
                </div>
              </div>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <div className="p-8 md:p-12 min-h-[500px] md:min-h-[600px]">
                <h2 className="text-xl font-semibold text-center mb-8 md:hidden">
                  Sign Up With Malabar
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* First Name with Title */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      First Name<span className="text-header">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                        disabled={isLoading}
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                      </select>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Last Name<span className="text-header">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Email Address<span className="text-header">*</span>
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Mobile No<span className="text-header">*</span>
                    </label>
                    <PhoneInput
                      country="bd"
                      value={phone}
                      onChange={(value) => setPhone(value)}
                      containerClass="w-full"
                      inputClass="!w-full !h-[52px] !border-gray-300 focus:!border-header"
                      buttonClass="!border-gray-300"
                      dropdownClass="z-[9999]"
                      inputProps={{ required: true }}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Enter Password */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Enter Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Register Button */}
                <div className="flex justify-center mb-4 mt-8">
                  <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-20 rounded shadow-lg hover:shadow-xl hover:scale-103 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'REGISTERING...' : 'REGISTER TO CONTINUE'}
                  </button>
                </div>

                {/* Already have account */}
                <div className="text-center">
                  <span className="text-gray-600">
                    Already have an account?{' '}
                  </span>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="text-header font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Log In!
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Forgot Password Form */
          <div className="p-8 md:p-12 min-h-[500px]">
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

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address<span className="text-header">*</span>
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-header"
                required
                disabled={isLoading}
              />
            </div>

            <p className="text-sm text-header mb-4">* Required Fields</p>

            <div className="mb-6">
              <button
                onClick={handleBackToLogin}
                className="text-gray-700 hover:text-header font-medium"
                disabled={isLoading}
              >
                &lt; Back to Login
              </button>
            </div>

            <div>
              <button
                onClick={handleForgotPasswordSubmit}
                disabled={isLoading}
                className="bg-linear-to-r from-header to-header/80 text-white font-semibold py-3 px-12 rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'SENDING...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login