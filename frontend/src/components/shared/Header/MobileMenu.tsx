import { getCategoryTree, type Category } from '@/api/categories'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Loader2, LogOut, Package, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/contexts/SettingsContext'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const { isAuthenticated, user, logout } = useAuth()
  const { contact_phone } = useSettings()
  const navigate = useNavigate()

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate({ to: '/' })
  }

  // Fetch categories from API
  const { data: categories, isLoading } = useQuery({
    queryKey: ['category-tree-mobile'],
    queryFn: async () => {
      const result = await getCategoryTree()
      if (result.success && Array.isArray(result.data)) {
        return result.data
      }
      return []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Reset expanded state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedCategories(new Set())
    }
  }, [isOpen])

  if (!isOpen) return null

  const renderCategory = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const paddingLeft = 20 + (depth * 16)

    // Categories with children: tap to expand/collapse
    if (hasChildren) {
      return (
        <div key={category.id}>
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full flex items-center justify-between py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '20px' }}
          >
            <span className="text-[15px] text-gray-900 font-normal text-left">
              {category.name}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            )}
          </button>

          {/* Children when expanded */}
          {isExpanded && (
            <div className="bg-gray-50">
              {/* View All link for parent category */}
              <Link
                to="/categories/$slug"
                params={{ slug: category.slug }}
                onClick={onClose}
                className="flex items-center justify-between py-3 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-100"
                style={{ paddingLeft: `${paddingLeft + 16}px`, paddingRight: '20px' }}
              >
                <span className="text-[14px] text-header font-medium">
                  View All {category.name}
                </span>
                <ChevronRight className="w-4 h-4 text-header shrink-0" />
              </Link>
              {/* Child categories */}
              {category.children
                .filter(child => child.is_active)
                .map(child => renderCategory(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // Categories without children: tap to navigate
    return (
      <div key={category.id}>
        <Link
          to="/categories/$slug"
          params={{ slug: category.slug }}
          onClick={onClose}
          className="flex items-center justify-between py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
          style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '20px' }}
        >
          <span className="text-[15px] text-gray-900 font-normal">
            {category.name}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[50] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel - positioned below header */}
      <div className="absolute left-0 top-20 h-full w-full max-w-[280px] sm:max-w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        {/* Categories List */}
        <div className="flex-1 bg-white overflow-y-auto">
          <nav className="py-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-header" />
              </div>
            ) : !categories || categories.length === 0 ? (
              <div className="px-5 py-3.5 text-gray-500 text-sm">
                No categories available
              </div>
            ) : (
              categories
                .filter(cat => cat.is_active)
                .map(category => renderCategory(category))
            )}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="bg-footer px-4 py-5 shrink-0 border-t border-gray-200">
          {isAuthenticated && user ? (
            <>
              {/* User info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-header flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.first_name?.[0] ?? ""}{user.last_name?.[0] ?? ""}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              {/* Account links */}
              <div className="flex flex-col gap-1 mb-4">
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-md text-sm text-gray-700 hover:bg-white/60 transition-colors"
                >
                  <User className="w-4 h-4 text-header" />
                  My Account
                </Link>
                <Link
                  to="/orders"
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-md text-sm text-gray-700 hover:bg-white/60 transition-colors"
                >
                  <Package className="w-4 h-4 text-header" />
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3 mb-5">
              <Link
                to="/profile"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-header text-white rounded-md text-center text-sm font-semibold transition-colors shadow-sm"
              >
                Login
              </Link>
              <Link
                to="/profile"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-header text-header rounded-md text-center text-sm font-semibold transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Help Section */}
          {contact_phone && (
            <div className="text-left">
              <p className="text-xs text-gray-700 leading-relaxed">
                NEED HELP? CALL{' '}
                <a
                  href={`tel:${contact_phone}`}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  {contact_phone}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
