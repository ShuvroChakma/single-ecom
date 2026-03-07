import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import Login from '@/components/shared/Profile/Login'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import {
  User, Package, Heart, MapPin, LogOut, ChevronRight, ShieldCheck
} from 'lucide-react'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

const NAV_ITEMS = [
  { to: '/orders',   icon: Package,    label: 'My Orders',    desc: 'Track and manage your orders' },
  { to: '/wishlist', icon: Heart,      label: 'Wishlist',     desc: 'Items you saved for later' },
  { to: '/profile/addresses', icon: MapPin, label: 'Addresses', desc: 'Manage delivery addresses' },
]

function RouteComponent() {
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-header" />
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

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Profile header card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-header/10 flex items-center justify-center flex-shrink-0">
              <User className="text-header" size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-500 text-sm truncate">{user?.email}</p>
              {user?.is_verified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ShieldCheck size={13} /> Verified account
                </span>
              ) : (
                <span className="text-xs text-yellow-600 mt-1">Not verified</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Navigation grid */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {NAV_ITEMS.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-header/10 flex items-center justify-center flex-shrink-0 group-hover:bg-header/20 transition-colors">
                  <Icon className="text-header" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-header transition-colors mt-1" size={18} />
              </Link>
            ))}
          </div>

          {/* Account info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Account Details</h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              {user?.title && (
                <div>
                  <dt className="text-gray-500">Title</dt>
                  <dd className="font-medium mt-0.5">{user.title}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-medium mt-0.5">{user?.first_name} {user?.last_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium mt-0.5">{user?.email}</dd>
              </div>
              {user?.phone && (
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium mt-0.5">{user.phone}</dd>
                </div>
              )}
            </dl>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  )
}
