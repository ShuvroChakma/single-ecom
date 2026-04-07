import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Header from '@/components/shared/Header/Header'
import MyAccountPage from '@/components/shared/Profile/MyAccountPage'
import Footer from '@/components/shared/Footer/Footer'
import { useAuth } from '@/hooks/useAuth'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const Route = createFileRoute('/wishlist')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showLoginModal } = useLoginModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showLoginModal('Please login to view your wishlist', () => {
        navigate({ to: '/wishlist' })
      })
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return null

  return (
    <div>
      <Header />
      <MyAccountPage initialSection="wishlist" />
      <Footer />
    </div>
  )
}
