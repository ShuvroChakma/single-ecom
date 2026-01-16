import  { useState } from 'react';
import { Share2, X } from 'lucide-react';

export default function MyAccountPage() {
  const [activeSection, setActiveSection] = useState('profile'); // 'profile', 'wishlist', 'orders', 'editProfile', 'changePassword'
  
  // Sample data - will come from backend via props or API
  const userData = {
    name: "Shuvro Chakma",
    email: "shubrachakma101@gmail.com",
    mobile: "+8801794213557",
    pincode: "",
    gender: "",
    birthday: ""
  };

  const wishlistItems = [
    {
      id: 1,
      image: "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/small_image/286x200/9df78eab33525d08d6e5fb8d27136e95/f/r/frdzl48052.jpg",
      sku: "FRDZL48052",
      price: 65654,
      originalPrice: 67334
    },
    {
      id: 2,
      image: "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/small_image/286x200/9df78eab33525d08d6e5fb8d27136e95/b/r/brdzl40932.jpg",
      sku: "BRDZL40932",
      price: 20819,
      originalPrice: null
    }
  ];

  const orderItems = [
    {
      id: 1,
      image: "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/small_image/286x200/9df78eab33525d08d6e5fb8d27136e95/f/r/frdzl48052.jpg",
      name: "Gold Ring",
      sku: "GRNG12345",
      price: 45000,
      orderDate: "Dec 15, 2024",
      status: "Delivered",
      orderNumber: "ORD-2024-001"
    },
    {
      id: 2,
      image: "https://static.malabargoldanddiamonds.com/media/catalog/product/cache/1/small_image/286x200/9df78eab33525d08d6e5fb8d27136e95/b/r/brdzl40932.jpg",
      name: "Gold Bracelet",
      sku: "BRDZL40932",
      price: 20819,
      orderDate: "Dec 10, 2024",
      status: "In Transit",
      orderNumber: "ORD-2024-002"
    }
  ];

  const getBreadcrumb = () => {
    if (activeSection === 'profile') return 'Profile';
    if (activeSection === 'wishlist') return 'My Wishlist';
    if (activeSection === 'orders') return 'My Orders';
    if (activeSection === 'editProfile') return 'Edit Profile';
    if (activeSection === 'changePassword') return 'Change Password';
    return 'My Account';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
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
              <p className="text-gray-600 mb-4">Hi, {userData.name}</p>
              
              <button className="w-full border bg-header text-white px-4 py-2 rounded hover:bg-header/90 hover:text-white mb-6">
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
                  Account Informations
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
                    <span className="font-medium">{userData.name}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Email ID :</span>
                    <span className="font-medium">{userData.email}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Mobile :</span>
                    <span className="font-medium">{userData.mobile}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Pincode :</span>
                    <span className="font-medium text-gray-400">{userData.pincode || '-'}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Gender :</span>
                    <span className="font-medium text-gray-400">{userData.gender || '-'}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Birthday :</span>
                    <span className="font-medium text-gray-400">{userData.birthday || '-'}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveSection('changePassword')}
                    className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90"
                  >
                    Change Password
                  </button>
                  <button 
                    onClick={() => setActiveSection('editProfile')}
                    className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist Section */}
            {activeSection === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h2 className="text-2xl font-semibold mb-6">Your Wishlist</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-2 relative">
                      {/* Share and Remove Icons */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between">
                        <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                          <Share2 className="w-4 h-4 text-header"/>
                        </button>
                        <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Product Image */}
                      <div className="mb-4 flex items-center justify-center py-8">
                        <img 
                          src={item.image} 
                          alt={item.sku}
                          className="w-full h-48 object-contain"
                        />
                      </div>

                      {/* Price and SKU */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold">₹ {item.price.toLocaleString('en-IN')}</span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹ {item.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      </div>

                      {/* Move to Cart Button */}
                      <button 
                        className="w-full border-2 text-center py-2 rounded font-medium hover:bg-pink-50 transition-colors"
                        style={{borderColor: '#a61e5a', color: '#a61e5a'}}
                      >
                        MOVE TO CART
                      </button>
                    </div>
                  ))}
                </div>

                {wishlistItems.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Your wishlist is empty</p>
                    <a href="/" className="text-header hover:underline mt-2 inline-block">
                      Continue Shopping
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Edit Profile Section */}
            {activeSection === 'editProfile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        First Name<span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="border rounded px-3 py-2 focus:outline-none focus:border-gray-400">
                          <option>Mr</option>
                          <option>Ms</option>
                          <option>Mrs</option>
                        </select>
                        <input 
                          type="text"
                          defaultValue="Shuvro"
                          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Last Name<span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        defaultValue="Chakma"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    {/* Mobile No */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Mobile No<span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="border rounded px-2 py-2 focus:outline-none focus:border-gray-400">
                          <option>🇧🇩</option>
                        </select>
                        <input 
                          type="tel"
                          defaultValue="+8801794213557"
                          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>

                    {/* Email ID */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Email ID<span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email"
                        defaultValue="shubrachakma101@gmail.com"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Gender</label>
                      <div className="flex gap-4">
                        <button 
                          type="button"
                          className="flex-1 border rounded px-4 py-2 hover:bg-gray-50 focus:border-header"
                        >
                          Male
                        </button>
                        <button 
                          type="button"
                          className="flex-1 border rounded px-4 py-2 hover:bg-gray-50 focus:border-header"
                        >
                          Female
                        </button>
                      </div>
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Pincode<span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Enter Pincode"
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Date of Birth<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="date"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>

                    {/* Relationship Status */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Relationship Status<span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mb-3">
                        <button 
                          type="button"
                          className="flex-1 border rounded px-4 py-2 hover:bg-gray-50 focus:border-header"
                        >
                          Married
                        </button>
                        <button 
                          type="button"
                          className="flex-1 border rounded px-4 py-2 hover:bg-gray-50 focus:border-header"
                        >
                          Single
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Select Anniversary Date"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400 text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit"
                      className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90"
                    >
                      Save Details
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

            {/* Change Password Section */}
            {activeSection === 'changePassword' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Profile details</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Name :</span>
                    <span className="font-medium">{userData.name}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Email ID :</span>
                    <span className="font-medium">{userData.email}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Mobile :</span>
                    <span className="font-medium">{userData.mobile}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Pincode :</span>
                    <span className="font-medium text-gray-400">{userData.pincode || '-'}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Gender :</span>
                    <span className="font-medium text-gray-400">{userData.gender || '-'}</span>
                  </div>
                  
                  <div className="flex border-b pb-4">
                    <span className="text-gray-600 w-32">Birthday :</span>
                    <span className="font-medium text-gray-400">{userData.birthday || '-'}</span>
                  </div>
                </div>

                <div className="flex gap-4 mb-8">
                  <button 
                    className="bg-header text-white px-8 py-3 rounded font-medium"
                  >
                    Change Password
                  </button>
                  <button 
                    onClick={() => setActiveSection('editProfile')}
                    className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90"
                  >
                    Edit Profile
                  </button>
                </div>

                <form className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current Password<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      New Password<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Confirm New Password<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <p className="text-xs text-red-500">* Required Fields</p>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit"
                      className="bg-header text-white px-8 py-3 rounded font-medium hover:opacity-90"
                    >
                      Save Details
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
                
                {orderItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        
                        {/* Product Image */}
                        <div className="mb-4 flex items-center justify-center py-8 rounded">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-48 object-contain"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="mb-3">
                          <h3 className="font-semibold mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">SKU: {item.sku}</p>
                          <p className="text-sm text-gray-600 mb-2">Order #{item.orderNumber}</p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-semibold">₹ {item.price.toLocaleString('en-IN')}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.status === 'Delivered' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Ordered on: {item.orderDate}</p>
                        </div>

                        {/* View Details Button */}
                        <button 
                          className="w-full border-2 text-center py-2 rounded font-medium hover:bg-pink-50 transition-colors"
                          style={{borderColor: 'header', color: 'header'}}
                        >
                          VIEW DETAILS
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">You haven't placed any orders yet</p>
                    <a href="/" className="text-header hover:underline mt-2 inline-block">
                      Start Shopping
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
}