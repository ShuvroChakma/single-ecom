import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import TopBar from './TopBar';
import NavIcons from './NavIcons';
import CategoryNav from './CategoryNav';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className="w-full relative z-40">
        {/* TopBar - only visible when not scrolled on md+ */}
        <div className={`${isScrolled ? 'hidden md:hidden' : 'block'}`}>
          <TopBar />
        </div>

        {/* Sticky wrapper for Main Header + CategoryNav */}
        <div className={`
          bg-white
          ${isMobileMenuOpen ? 'sticky top-0 z-100 lg:relative' : ''}
          ${isScrolled && !isMobileMenuOpen ? 'md:sticky md:top-0 md:z-100' : ''}
        `}>
          {/* Main Header */}
          <div className="bg-header text-white">
            <div className="max-w-[1920px] mx-auto px-2 md:px-2 lg:px-2">
              <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-6 xl:gap-8 py-4 md:py-5">
                {/* Mobile Menu */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden hover:bg-white/10 rounded-md "
                >
                  <Menu className="w-8 h-8" />
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

          {/* CategoryNav - part of sticky wrapper on md+ */}
          <CategoryNav />
        </div>
      </header>

      {/* MobileMenu with higher z-index */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;