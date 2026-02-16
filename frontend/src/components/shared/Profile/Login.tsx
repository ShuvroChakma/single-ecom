/**
 * Login Page Component
 * Container that orchestrates Login, Register, Forgot Password, Reset Password, and OTP Verification forms
 */
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { ResetPasswordForm } from './ResetPasswordForm'
import { OTPVerificationForm } from './OTPVerificationForm'

type ActiveTab = 'login' | 'register'

const Login = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('login')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string>('')
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMessage(null)
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setShowResetPassword(false)
    setShowOTPVerification(false)
    setActiveTab('login')
    setError(null)
    setSuccessMessage(null)
  }

  const handleNeedVerification = (email: string) => {
    setVerificationEmail(email)
    setShowOTPVerification(true)
    setError(null)
    setSuccessMessage(null)
  }

  const handleVerificationSuccess = () => {
    setShowOTPVerification(false)
    setActiveTab('login')
    setSuccessMessage('Email verified successfully! You can now log in.')
  }

  const handleForgotPasswordOTPSent = (email: string) => {
    setResetPasswordEmail(email)
    setShowForgotPassword(false)
    setShowResetPassword(true)
    setError(null)
    setSuccessMessage(null)
  }

  const handleResetPasswordSuccess = () => {
    setShowResetPassword(false)
    setActiveTab('login')
    setSuccessMessage('Password reset successfully! You can now log in with your new password.')
  }

  const handleBackToForgotPassword = () => {
    setShowResetPassword(false)
    setShowForgotPassword(true)
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-md overflow-hidden">
        {showOTPVerification ? (
          <OTPVerificationForm
            email={verificationEmail}
            onSuccess={handleVerificationSuccess}
            onBackToLogin={handleBackToLogin}
          />
        ) : !showForgotPassword ? (
          <>
            {/* Tab Headers */}
            <div className="flex relative">
              <button
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-6 text-center font-semibold text-lg transition-colors relative ${
                  activeTab === 'login'
                    ? 'bg-header text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => handleTabChange('register')}
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

            {/* Success Message after verification */}
            {successMessage && (
              <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Forms */}
            {activeTab === 'login' && (
              <LoginForm
                onForgotPassword={() => setShowForgotPassword(true)}
                onSwitchToRegister={() => handleTabChange('register')}
                onNeedVerification={handleNeedVerification}
                error={error}
                setError={setError}
              />
            )}

            {activeTab === 'register' && (
              <RegisterForm
                onSwitchToLogin={() => handleTabChange('login')}
                onNeedVerification={handleNeedVerification}
                onSuccess={setSuccessMessage}
                error={error}
                setError={setError}
                successMessage={successMessage}
              />
            )}
          </>
        ) : showResetPassword ? (
          <ResetPasswordForm
            email={resetPasswordEmail}
            onSuccess={handleResetPasswordSuccess}
            onBackToForgotPassword={handleBackToForgotPassword}
          />
        ) : (
          <ForgotPasswordForm
            onBackToLogin={handleBackToLogin}
            onOTPSent={handleForgotPasswordOTPSent}
            error={error}
            setError={setError}
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
          />
        )}
      </div>
    </div>
  )
}

export default Login
