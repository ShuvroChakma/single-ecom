import { createContext, useContext, useState, useCallback } from 'react'

interface LoginModalState {
  open: boolean
  message: string
  onSuccess?: () => void
}

interface LoginModalContextType {
  state: LoginModalState
  showLoginModal: (message?: string, onSuccess?: () => void) => void
  hideLoginModal: () => void
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined)

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoginModalState>({
    open: false,
    message: 'Please login to continue',
  })

  const showLoginModal = useCallback((
    message = 'Please login to continue',
    onSuccess?: () => void
  ) => {
    setState({ open: true, message, onSuccess })
  }, [])

  const hideLoginModal = useCallback(() => {
    setState(prev => ({ ...prev, open: false, onSuccess: undefined }))
  }, [])

  return (
    <LoginModalContext.Provider value={{ state, showLoginModal, hideLoginModal }}>
      {children}
    </LoginModalContext.Provider>
  )
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext)
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider')
  return ctx
}
