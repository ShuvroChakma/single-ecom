import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const Route = createFileRoute('/orders')({
  component: OrdersLayout,
})

function OrdersLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showLoginModal } = useLoginModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showLoginModal('Please login to view your orders', () => {
        navigate({ to: '/orders' })
      })
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return null

  return <Outlet />
}
