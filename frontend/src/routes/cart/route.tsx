import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import ShoppingCart from '@/components/shared/Profile/ShoppingCart'
import { useAuth } from '@/hooks/useAuth'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const Route = createFileRoute('/cart')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showLoginModal } = useLoginModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showLoginModal('Please login to view your cart', () => {
        navigate({ to: '/cart' })
      })
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return null

  return (
    <div>
      <Header />
      <ShoppingCart />
      <Footer />
    </div>
  )
}
