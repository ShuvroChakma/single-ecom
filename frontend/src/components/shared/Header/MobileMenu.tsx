import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useEffect } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
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

  if (!isOpen) return null

  const categories = [
    { name: 'Diamond', path: '/categories/diamond' },
    { name: 'Gold', path: '/categories/gold' },
    { name: 'Gemstone', path: '/categories/gemstone' },
    { name: 'Uncut Diamond', path: '/categories/uncut-diamond' },
    { name: 'Platinum', path: '/categories/platinum' },
    { name: 'Gold Coins', path: '/categories/gold-coins' },
    { name: 'Silver', path: '/categories/silver' },
    { name: 'Watches', path: '/categories/watches' },
    { name: 'Gifts', path: '/categories/gifts' },
    { name: 'Jewellery', path: '/categories/jewellery' },
    { name: 'Gift Cards', path: '/categories/gift-cards' },
    { name: 'Gold Rate', path: '/categories/gold-rate' },
  ]

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="absolute left-0 top-12 h-full w-full max-w-[280px] sm:max-w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        {/* Categories List */}
        <div className="flex-1  bg-white overflow-y-auto">
          <nav className="py-10">
            {categories.map((category, index) => (
              <Link
                key={category.name}
                to={category.path}
                onClick={onClose}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  index < categories.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <span className="text-[15px] text-gray-900 font-normal">
                  {category.name}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="bg-footer px-4 py-5 shrink-0 border-t border-gray-200">
          {/* Auth Buttons */}
          <div className="flex gap-3 mb-5">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-header text-white rounded-md text-center text-sm font-semibold hover:bg-header active:bg-header transition-colors shadow-sm"
            >
              Login
            </Link>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-header text-white rounded-md text-center text-sm font-semibold hover:bg-header active:bg-header transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>

          {/* Help Section */}
          <div className="text-left">
            <p className="text-xs text-gray-700 leading-relaxed">
              NEED HELP? CALL{' '}
              <a
                href="tel:+912262300916"
                className="font-semibold text-gray-900 hover:underline"
              >
                +91 22 62300916
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
