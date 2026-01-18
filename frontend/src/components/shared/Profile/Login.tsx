/**
 * Login Page Component
 * Container that orchestrates Login, Register, Forgot Password, and OTP Verification forms
 */
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { OTPVerificationForm } from './OTPVerificationForm'

type ActiveView = 'login' | 'register' | 'forgot-password' | 'otp-verification'

const Login = () => {
  const [activeView, setActiveView] = useState<ActiveView>('login')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string>('')

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view)
    setError(null)
    setSuccessMessage(null)
  }

  const handleRegistrationSuccess = (email: string, message: string) => {
    setVerificationEmail(email)
    setSuccessMessage(message)
    setActiveView('otp-verification')
  }

  const handleEmailNotVerified = (email: string) => {
    setVerificationEmail(email)
    setActiveView('otp-verification')
  }

  const handleOTPSuccess = () => {
    setSuccessMessage('Email verified successfully! Please login.')
    setActiveView('login')
  }

  const handleBackToLogin = () => {
    setActiveView('login')
    setError(null)
    setSuccessMessage(null)
    setVerificationEmail('')
  }

  // Show OTP verification
  if (activeView === 'otp-verification') {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white shadow-md rounded-md overflow-hidden">
          <OTPVerificationForm
            email={verificationEmail}
            onSuccess={handleOTPSuccess}
            onBackToLogin={handleBackToLogin}
          />
        </div>
      </div>
    )
  }

  // Show Forgot Password
  if (activeView === 'forgot-password') {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white shadow-md rounded-md overflow-hidden">
          <ForgotPasswordForm
            onBackToLogin={handleBackToLogin}
            error={error}
            setError={setError}
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
          />
        </div>
      </div>
    )
  }

  // Show Login/Register tabs
  return (
    <div className="bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-md overflow-hidden">
        {/* Tab Headers */}
        <div className="flex relative">
          <button
            onClick={() => handleViewChange('login')}
            className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
              activeView === 'login'
                ? 'bg-header text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => handleViewChange('register')}
            className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
              activeView === 'register'
                ? 'bg-header text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
          <div
            className={`absolute bottom-0 w-0 h-0 border-l-15 border-l-transparent border-r-15 border-r-transparent border-t-15 border-t-header transition-all duration-300 ${
              activeView === 'login' ? 'left-1/4' : 'left-3/4'
            } transform -translate-x-1/2 translate-y-full`}
          />
        </div>

        {/* Forms */}
        {activeView === 'login' && (
          <LoginForm
            onForgotPassword={() => handleViewChange('forgot-password')}
            onSwitchToRegister={() => handleViewChange('register')}
            onEmailNotVerified={handleEmailNotVerified}
            error={error}
            setError={setError}
            successMessage={successMessage}
          />
        )}

        {activeView === 'register' && (
          <RegisterForm
            onSwitchToLogin={() => handleViewChange('login')}
            onSuccess={handleRegistrationSuccess}
            error={error}
            setError={setError}
          />
        )}
      </div>
    </div>
  )
}

export default Login
