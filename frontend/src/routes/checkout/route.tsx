
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Header from '@/components/shared/Header/Header'
import Checkout from '@/components/shared/Products/Checkout'
import Footer from '@/components/shared/Footer/Footer'
import { useAuth } from '@/hooks/useAuth'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const Route = createFileRoute('/checkout')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showLoginModal } = useLoginModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showLoginModal('Please login to proceed to checkout', () => {
        // onSuccess: user logged in, stay on checkout
      })
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return null

  return <div>
    <Header />
    <Checkout />
    <Footer />
  </div>
}
