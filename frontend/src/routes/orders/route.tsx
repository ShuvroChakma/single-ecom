import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { checkAuth } from '@/api/auth'

export const Route = createFileRoute('/orders')({
  beforeLoad: async () => {
    const { isAuthenticated } = await checkAuth()
    if (!isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  pendingComponent: OrdersPending,
  component: () => <Outlet />,
})

function OrdersPending() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
    </div>
  )
}
