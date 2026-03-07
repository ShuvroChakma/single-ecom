import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  User, Package, Heart, MapPin, LogOut, ChevronRight, ShieldCheck,
  KeyRound, Loader2, ShoppingBag, Calendar, Phone, Mail,
} from 'lucide-react'
import { getOrdersList } from '@/api/orders'
import { getWishlist } from '@/api/wishlist'
import { getAddresses } from '@/api/addresses'
import { useState } from 'react'
import { changePassword } from '@/api/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/profile/')({
  component: RouteComponent,
})

const NAV_ITEMS = [
  { to: '/orders',             icon: Package,  label: 'My Orders',       desc: 'Track and manage your orders' },
  { to: '/wishlist',           icon: Heart,    label: 'Wishlist',         desc: 'Items you saved for later' },
  { to: '/profile/addresses',  icon: MapPin,   label: 'Addresses',        desc: 'Manage delivery addresses' },
  { to: null, icon: KeyRound,  label: 'Change Password', desc: 'Update your account password', action: 'changePassword' as const },
]

const STATUS_COLORS: Record<string, string> = {
  delivered:  'bg-emerald-100 text-emerald-700',
  shipped:    'bg-purple-100 text-purple-700',
  processing: 'bg-indigo-100 text-indigo-700',
  confirmed:  'bg-blue-100 text-blue-700',
  pending:    'bg-amber-100 text-amber-700',
  cancelled:  'bg-red-100 text-red-700',
}

function RouteComponent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders', 0],
    queryFn: () => getOrdersList({ data: { limit: 5, offset: 0 } }),
  })
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => getWishlist(),
  })
  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      changePassword({ data }),
    onSuccess: () => {
      setPwSuccess('Password changed successfully!')
      setPwError('')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error: any) => {
      setPwError(error.message || 'Failed to change password')
      setPwSuccess('')
    },
  })

  const recentOrders = ordersData?.data || []
  const wishlistCount = wishlistData?.success ? wishlistData.data.items?.length ?? 0 : 0
  const addressCount = addressesData?.data?.addresses?.length ?? 0
  const orderCount = recentOrders.length

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match')
      return
    }
    if (pwForm.new_password.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }
    changePasswordMutation.mutate({
      current_password: pwForm.current_password,
      new_password: pwForm.new_password,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Profile header card */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-header/10 flex items-center justify-center shrink-0">
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
              <span className="text-xs text-yellow-600 mt-1 block">Not verified</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Orders',    value: orderCount,    icon: Package, to: '/orders' },
            { label: 'Wishlist',  value: wishlistCount, icon: Heart,   to: '/wishlist' },
            { label: 'Addresses', value: addressCount,  icon: MapPin,  to: '/profile/addresses' },
          ].map(({ label, value, icon: Icon, to }) => (
            <Link key={label} to={to} className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-full bg-header/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-header/20 transition-colors">
                <Icon className="text-header" size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </Link>
          ))}
        </div>

        {/* Navigation grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label, desc, action }) => {
            if (action === 'changePassword') {
              return (
                <button
                  key={label}
                  onClick={() => setShowPasswordForm(s => !s)}
                  className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-start gap-4 group text-left w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-header/10 flex items-center justify-center shrink-0 group-hover:bg-header/20 transition-colors">
                    <Icon className="text-header" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className={`text-gray-300 group-hover:text-header transition-all mt-1 ${showPasswordForm ? 'rotate-90' : ''}`} size={18} />
                </button>
              )
            }
            return (
              <Link
                key={label}
                to={to!}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-header/10 flex items-center justify-center shrink-0 group-hover:bg-header/20 transition-colors">
                  <Icon className="text-header" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-header transition-colors mt-1" size={18} />
              </Link>
            )
          })}
        </div>

        {/* Change Password Form */}
        {showPasswordForm && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
              {pwError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">{pwSuccess}</div>
              )}
              {[
                { label: 'Current Password',     key: 'current_password' },
                { label: 'New Password',          key: 'new_password' },
                { label: 'Confirm New Password',  key: 'confirm_password' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    type="password"
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={(e) => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    minLength={key === 'new_password' ? 8 : undefined}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex items-center gap-2 bg-header text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {changePasswordMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Save Password
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPasswordForm(false); setPwError(''); setPwSuccess('') }}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Account Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Full Name</p>
                <p className="font-medium mt-0.5">{user?.first_name} {user?.last_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium mt-0.5 break-all">{user?.email}</p>
              </div>
            </div>
            {user?.phone_number && (
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs">Phone</p>
                  <p className="font-medium mt-0.5">{user.phone_number}</p>
                </div>
              </div>
            )}
            {user?.created_at && (
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs">Member Since</p>
                  <p className="font-medium mt-0.5">
                    {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/orders" className="text-xs text-header hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const statusColor = STATUS_COLORS[order.status.toLowerCase()] || STATUS_COLORS.pending
                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <ShoppingBag size={18} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">#{order.order_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{order.item_count} item{order.item_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                      </span>
                      <span className="font-semibold text-sm">৳{Number(order.total).toLocaleString()}</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-header transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
