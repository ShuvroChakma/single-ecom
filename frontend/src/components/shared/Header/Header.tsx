import { useState } from 'react'
import { Menu } from 'lucide-react'
import MobileMenu from './MobileMenu'
import SearchBar from './SearchBar'
import TopBar from './TopBar'
import NavIcons from './NavIcons'
import CategoryNav from './CategoryNav'

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  return (
    <header className="w-full">
      <TopBar />

      {/* Main Header */}
      <div className="bg-header text-white">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-6 xl:gap-8 py-4 md:py-5">
            {/* Mobile Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center shrink-0">
              <img
                src="https://static.malabargoldanddiamonds.com/skin/frontend/malabar/default/images/new_icons/logo.svg"
                alt="Malabar Gold & Diamonds"
                className="h-full md:h-13 lg:h-15 w-auto object-contain"
              />
            </a>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-3xl">
              <SearchBar />
            </div>

            {/* Mobile Search */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden flex flex-col items-center gap-1 text-primary-foreground hover:opacity-90"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-xs font-medium">Search</span>
            </button>

            {/* Nav Icons */}
            <NavIcons />
          </div>

          {isMobileSearchOpen && (
            <div className="md:hidden pb-3">
              <SearchBar />
            </div>
          )}
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <CategoryNav />
    </header>
  )
}

export default Header
