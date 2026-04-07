import { useState } from 'react'
import { X, Loader2, Eye, EyeOff, LogIn } from 'lucide-react'
import { useLoginModal } from '@/contexts/LoginModalContext'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/api/client'

export default function LoginModal() {
  const { state, hideLoginModal } = useLoginModal()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  if (!state.open) return null

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError('')
    setIsPending(false)
    hideLoginModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setIsPending(true)
    try {
      await login(email, password)
      handleClose()
      state.onSuccess?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-header px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">Login Required</h2>
              <p className="text-white/80 text-xs">{state.message}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isPending}
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-header/30 focus:border-header disabled:opacity-50 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isPending}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-header/30 focus:border-header disabled:opacity-50 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-header text-white py-3 rounded-lg font-semibold hover:bg-header/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
            ) : (
              'Login'
            )}
          </button>

          <div className="text-center pt-1">
            <span className="text-gray-500 text-sm">Don't have an account? </span>
            <a href="/profile" onClick={handleClose} className="text-header text-sm font-medium hover:underline">
              Create one
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
