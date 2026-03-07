import { useState, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Share2, X, Loader2, Package, Heart, ShoppingBag, MapPin, Plus, Trash2, Star, ChevronRight, Edit2 } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthContext } from '@/contexts/AuthContext'
import { getWishlist, removeFromWishlist, moveToCart, type WishlistItem } from '@/api/wishlist'
import { getOrdersList, type OrderListItem } from '@/api/orders'
import { changePassword } from '@/api/auth'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address,
  type AddressCreateRequest,
  type AddressUpdateRequest
} from '@/api/addresses'
import { getImageUrl } from '@/api/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'

// Bangladesh districts
const BD_DISTRICTS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Narayanganj', 'Tangail', 'Bogra', 'Jessore', 'Cox\'s Bazar', 'Dinajpur',
  'Brahmanbaria', 'Narsingdi', 'Savar', 'Tongi', 'Jamalpur', 'Rangamati', 'Pabna', 'Noakhali'
].sort()

interface MyAccountPageProps {
  initialSection?: string
}

export default function MyAccountPage({ initialSection = 'profile' }: MyAccountPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)
  const [activeSection, setActiveSection] = useState(initialSection)

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState<AddressCreateRequest>({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    postal_code: '',
    country: 'Bangladesh',
    is_default: false,
  })

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
    queryFn: () => getWishlist(),
    enabled: !!user,
  })

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getOrdersList({ data: { limit: 10, offset: 0 } }),
    enabled: !!user,
  })

  // Fetch addresses
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
    enabled: !!user,
  })

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: (itemId: string) => removeFromWishlist({ data: { itemId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Move to cart mutation
  const moveToCartMutation = useMutation({
    mutationFn: (itemId: string) => moveToCart({ data: { itemId } }),
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

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: (data: AddressCreateRequest) => createAddress({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      resetAddressForm()
    },
  })

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressUpdateRequest }) => updateAddress({ data: { addressId: id, updates: data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      resetAddressForm()
    },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => deleteAddress({ data: { addressId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (addressId: string) => setDefaultAddress({ data: { addressId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
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

  const resetAddressForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
    setAddressForm({
      label: 'Home',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      district: '',
      postal_code: '',
      country: 'Bangladesh',
      is_default: false,
    })
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      district: address.district,
      postal_code: address.postal_code || '',
      country: address.country,
      is_default: address.is_default,
    })
    setShowAddressForm(true)
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm })
    } else {
      createAddressMutation.mutate(addressForm)
    }
  }

  const wishlistItems = wishlistData?.success ? wishlistData.data.items : []
  const orders = ordersData?.data || []
  const addresses = addressesData?.data?.addresses || []
  const maxAddresses = addressesData?.data?.max_allowed || 5

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'shipped':
        return 'bg-purple-100 text-purple-700'
      case 'processing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getBreadcrumb = () => {
    if (activeSection === 'profile') return 'Profile'
    if (activeSection === 'wishlist') return 'My Wishlist'
    if (activeSection === 'orders') return 'My Orders'
    if (activeSection === 'addresses') return 'My Addresses'
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
                  className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                    activeSection === 'orders'
                      ? 'border border-header/90 text-header font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Package size={18} />
                  My Orders
                </button>

                <button
                  onClick={() => setActiveSection('wishlist')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                    activeSection === 'wishlist'
                      ? 'border border-header/90 text-header font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Heart size={18} />
                  My Wishlist
                </button>

                <button
                  onClick={() => setActiveSection('addresses')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                    activeSection === 'addresses'
                      ? 'border border-header/90 text-header font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <MapPin size={18} />
                  My Addresses
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

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">My Addresses</h2>
                  <span className="text-sm text-gray-500">{addresses.length}/{maxAddresses} addresses</span>
                </div>

                {addressesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-header" />
                  </div>
                ) : showAddressForm ? (
                  // Address Form
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <h3 className="font-semibold text-lg mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Label</Label>
                        <Combobox
                          options={[
                            { value: 'Home', label: 'Home' },
                            { value: 'Office', label: 'Office' },
                            { value: 'Other', label: 'Other' },
                          ]}
                          value={addressForm.label}
                          onChange={(v) => setAddressForm({ ...addressForm, label: v || 'Home' })}
                          placeholder="Select label"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Full Name <span className="text-red-500">*</span></Label>
                        <Input
                          type="text"
                          value={addressForm.full_name}
                          onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                          required
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Phone <span className="text-red-500">*</span></Label>
                        <Input
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          required
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>District <span className="text-red-500">*</span></Label>
                        <Combobox
                          options={BD_DISTRICTS.map(d => ({ value: d, label: d }))}
                          value={addressForm.district}
                          onChange={(v) => setAddressForm({ ...addressForm, district: v })}
                          placeholder="Select district"
                          searchPlaceholder="Search district..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Address <span className="text-red-500">*</span></Label>
                      <textarea
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                        required
                        rows={2}
                        placeholder="House/Flat No., Street, Area"
                        className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors resize-none"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>City <span className="text-red-500">*</span></Label>
                        <Input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Postal Code</Label>
                        <Input
                          type="text"
                          value={addressForm.postal_code}
                          onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                          placeholder="e.g. 1200"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressForm.is_default}
                        onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                        className="rounded border-gray-300 text-header focus:ring-header/20"
                      />
                      <span className="text-sm text-gray-700">Set as default address</span>
                    </label>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                        className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        {(createAddressMutation.isPending || updateAddressMutation.isPending) && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                        {editingAddress ? 'Update Address' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="border-2 border-header text-header px-8 py-3 rounded font-medium hover:bg-pink-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Address List
                  <>
                    {addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-4">No addresses saved yet</p>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="inline-flex items-center gap-2 bg-header text-white px-6 py-3 rounded font-medium hover:opacity-90"
                        >
                          <Plus size={18} />
                          Add Address
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          {addresses.map((address) => (
                            <div key={address.id} className="border rounded-lg p-4 relative">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-header bg-header/10 px-2 py-0.5 rounded">
                                    {address.label}
                                  </span>
                                  {address.is_default && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                      <Star size={12} fill="currentColor" />
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditAddress(address)}
                                    className="p-1.5 text-gray-500 hover:text-header hover:bg-gray-100 rounded"
                                    title="Edit"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteAddressMutation.mutate(address.id)}
                                    disabled={deleteAddressMutation.isPending}
                                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded"
                                    title="Delete"
                                  >
                                    {deleteAddressMutation.isPending ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <p className="font-medium">{address.full_name}</p>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-600 mt-1">{address.address_line1}</p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.district}
                                {address.postal_code && ` - ${address.postal_code}`}
                              </p>

                              {!address.is_default && (
                                <button
                                  onClick={() => setDefaultMutation.mutate(address.id)}
                                  disabled={setDefaultMutation.isPending}
                                  className="mt-3 text-sm text-header hover:underline"
                                >
                                  Set as default
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {addresses.length < maxAddresses && (
                          <button
                            onClick={() => setShowAddressForm(true)}
                            className="inline-flex items-center gap-2 text-header hover:underline"
                          >
                            <Plus size={18} />
                            Add New Address
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Wishlist Section */}
            {activeSection === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
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
                      <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        {/* Product Image */}
                        <Link to={`/products/${item.product.slug}-${item.product.id}`} className="block relative">
                          <div className="h-48 bg-gray-50 overflow-hidden">
                            <img
                              src={getImageUrl(item.product.image, '/placeholder-product.jpg')}
                              alt={item.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={(e) => { e.preventDefault(); removeFromWishlistMutation.mutate(item.id) }}
                            disabled={removeFromWishlistMutation.isPending}
                            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                          >
                            {removeFromWishlistMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                            )}
                          </button>
                        </Link>

                        {/* Details */}
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 leading-snug">{item.product.name}</h3>
                          {item.variant && (
                            <p className="text-xs text-gray-400 mb-1">
                              {item.variant.metal_type} {item.variant.metal_purity}
                              {item.variant.size && ` · Size ${item.variant.size}`}
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base font-semibold text-gray-900">
                              {item.variant?.calculated_price
                                ? `৳${item.variant.calculated_price.toLocaleString('en-IN')}`
                                : 'Price on request'
                              }
                            </span>
                          </div>

                          <button
                            onClick={() => moveToCartMutation.mutate(item.id)}
                            disabled={moveToCartMutation.isPending}
                            className="w-full border-2 border-header text-header text-sm text-center py-2 rounded-lg font-medium hover:bg-header hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {moveToCartMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <ShoppingBag size={14} />
                                Move to Cart
                              </>
                            )}
                          </button>
                        </div>
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

                  <div className="space-y-1.5">
                    <Label>Current Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>New Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Confirm New Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">My Orders</h2>
                  <Link to="/orders" className="text-header hover:underline text-sm">
                    View All
                  </Link>
                </div>

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
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="block border rounded-lg p-4 hover:border-header transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <p className="font-semibold">Order #{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">{order.item_count} item(s)</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="font-semibold">৳{Number(order.total).toLocaleString()}</span>
                            <ChevronRight size={20} className="text-gray-400" />
                          </div>
                        </div>
                      </Link>
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
