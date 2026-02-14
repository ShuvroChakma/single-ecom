import { useState, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Share2, X, Loader2, Package, Heart, ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthContext } from '@/contexts/AuthContext'
import { getWishlist, removeFromWishlist, moveToCart, type WishlistItem } from '@/api/wishlist'
import { getMyOrders, type Order } from '@/api/orders'
import { changePassword } from '@/api/auth'

export default function MyAccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)
  const [activeSection, setActiveSection] = useState('profile')

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Redirect if not authenticated
  if (!authContext?.isAuthenticated && !authContext?.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please login to view your account</h2>
          <Link to="/profile" className="text-header hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const user = authContext?.user

  // Fetch wishlist
  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: !!user,
  })

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders(1, 10),
    enabled: !!user,
  })

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: (itemId: string) => removeFromWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Move to cart mutation
  const moveToCartMutation = useMutation({
    mutationFn: (itemId: string) => moveToCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      changePassword({ data }),
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully!')
      setPasswordError('')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error: any) => {
      setPasswordError(error.message || 'Failed to change password')
      setPasswordSuccess('')
    },
  })

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    })
  }

  const handleLogout = async () => {
    await authContext?.logout()
    navigate({ to: '/' })
  }

  const wishlistItems = wishlistData?.success ? wishlistData.data.items : []
  const orders = ordersData?.success ? ordersData.data.items : []

  // Get image URL helper
  const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder-product.jpg'
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${path}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700'
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-700'
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-yellow-100 text-yellow-700'
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getBreadcrumb = () => {
    if (activeSection === 'profile') return 'Profile'
    if (activeSection === 'wishlist') return 'My Wishlist'
    if (activeSection === 'orders') return 'My Orders'
    if (activeSection === 'editProfile') return 'Edit Profile'
    if (activeSection === 'changePassword') return 'Change Password'
    return 'My Account'
  }

  if (authContext?.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-header" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => setActiveSection('profile')}
              className="text-gray-600 hover:text-gray-900"
            >
              Profile
            </button>
            {activeSection !== 'profile' && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{getBreadcrumb()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-2">My Account</h2>
              <p className="text-gray-600 mb-4">Hi, {user?.first_name || 'User'}</p>

              <button
                onClick={handleLogout}
                className="w-full border bg-header text-white px-4 py-2 rounded hover:bg-header/90 hover:text-white mb-6"
              >
                Logout
              </button>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('orders')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${
                    activeSection === 'orders'
                      ? 'border border-header/90 text-header font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  My Orders
                </button>

                <button
                  onClick={() => setActiveSection('wishlist')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${
                    activeSection === 'wishlist'
                      ? ' border border-header/90 text-header font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  My Wishlist
                </button>

                <button
                  onClick={() => setActiveSection('profile')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${
                    activeSection === 'profile'
                      ? 'border border-header/90 text-header font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Account Information
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Profile details</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Name :</span>
                    <span className="font-medium">{user?.first_name} {user?.last_name}</span>
                  </div>

                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Email ID :</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>

                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Mobile :</span>
                    <span className="font-medium">{user?.phone_number || '-'}</span>
                  </div>

                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Verified :</span>
                    <span className={`font-medium ${user?.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user?.is_verified ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Member Since :</span>
                    <span className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveSection('changePassword')}
                    className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist Section */}
            {activeSection === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h2 className="text-2xl font-semibold mb-6">Your Wishlist</h2>

                {wishlistLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-header" />
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Your wishlist is empty</p>
                    <Link to="/products" className="text-header hover:underline mt-2 inline-block">
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-2 relative">
                        {/* Share and Remove Icons */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                            <Share2 className="w-4 h-4 text-header"/>
                          </button>
                          <button
                            onClick={() => removeFromWishlistMutation.mutate(item.id)}
                            disabled={removeFromWishlistMutation.isPending}
                            className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
                          >
                            {removeFromWishlistMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>

                        {/* Product Image */}
                        <Link to={`/products/${item.product.slug}-${item.product.id}`}>
                          <div className="mb-4 flex items-center justify-center py-8">
                            <img
                              src={getImageUrl(item.product.image)}
                              alt={item.product.name}
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        </Link>

                        {/* Price and Details */}
                        <div className="mb-3">
                          <h3 className="font-medium text-gray-900 line-clamp-1">{item.product.name}</h3>
                          {item.variant && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-semibold">
                                {item.variant.calculated_price
                                  ? `৳ ${item.variant.calculated_price.toLocaleString('en-IN')}`
                                  : 'Price on request'
                                }
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-600">SKU: {item.variant?.sku || item.product.slug}</p>
                          {item.variant && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.variant.metal_type} {item.variant.metal_purity}
                              {item.variant.size && ` - Size ${item.variant.size}`}
                            </p>
                          )}
                        </div>

                        {/* Move to Cart Button */}
                        <button
                          onClick={() => moveToCartMutation.mutate(item.id)}
                          disabled={moveToCartMutation.isPending}
                          className="w-full border-2 text-center py-2 rounded font-medium hover:bg-pink-50 transition-colors disabled:opacity-50"
                          style={{borderColor: '#a61e5a', color: '#a61e5a'}}
                        >
                          {moveToCartMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            'MOVE TO CART'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Change Password Section */}
            {activeSection === 'changePassword' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Change Password</h2>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-header"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      New Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-header"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Confirm New Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-header"
                      required
                    />
                  </div>

                  <p className="text-xs text-gray-500">Password must be at least 8 characters</p>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Save Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('profile')}
                      className="border-2 border-header text-header px-8 py-3 rounded font-medium hover:bg-pink-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Section */}
            {activeSection === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">My Orders</h2>

                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-header" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">You haven't placed any orders yet</p>
                    <Link to="/products" className="text-header hover:underline mt-2 inline-block">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div>
                            <p className="font-semibold">Order #{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                            <span className="font-semibold">৳ {order.total.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={getImageUrl(item.product_image)}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        {/* View Details Button */}
                        <div className="mt-4 flex gap-3">
                          <Link
                            to={`/footer/track-order`}
                            className="flex-1 border-2 border-header text-header text-center py-2 rounded font-medium hover:bg-pink-50 transition-colors"
                          >
                            Track Order
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
