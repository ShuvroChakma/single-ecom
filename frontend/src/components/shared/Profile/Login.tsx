/**
 * Login Page Component
 * Container that orchestrates Login, Register, and Forgot Password forms
 */
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type ActiveTab = 'login' | 'register'

const Login = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('login')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMessage(null)
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

            {/* Forms */}
            {activeTab === 'login' && (
              <LoginForm
                onForgotPassword={() => setShowForgotPassword(true)}
                onSwitchToRegister={() => handleTabChange('register')}
                error={error}
                setError={setError}
              />
            )}

            {activeTab === 'register' && (
              <RegisterForm
                onSwitchToLogin={() => handleTabChange('login')}
                onSuccess={setSuccessMessage}
                error={error}
                setError={setError}
                successMessage={successMessage}
              />
            )}
          </>
        ) : (
          <ForgotPasswordForm
            onBackToLogin={handleBackToLogin}
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
