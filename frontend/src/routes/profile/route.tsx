/**
 * Profile Route
 * Path: src/routes/profile.tsx
 * Following admin structure pattern
 */
import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import Login from '@/components/shared/Profile/Login'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAuthenticated, user, logout, isLoading } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-header mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // If user is not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div>
        <Header />
        <Login />
        <Footer />
      </div>
    )
  }

  // User is authenticated, show profile content
  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* User Information */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <p className="text-gray-900 font-semibold">{user?.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <p className="text-gray-900 font-semibold">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900 font-semibold">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <p className="text-gray-900 font-semibold">{user?.phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <p className="text-gray-900 font-semibold">
                  {user?.is_verified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-600">⚠ Not Verified</span>
                  )}
                </p>
              </div>
            </div>

            {/* Additional profile sections */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
              <div className="space-y-3">
                <button className="w-full md:w-auto bg-header text-white px-6 py-2 rounded-md hover:bg-header/90 transition-colors">
                  Edit Profile
                </button>
                <button className="w-full md:w-auto ml-0 md:ml-4 bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
