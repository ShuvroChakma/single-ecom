import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import Login from '@/components/shared/Profile/Login'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/profile')({
  component: ProfileLayout,
})

function ProfileLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-header" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div>
        <Header />
        <Login />
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
