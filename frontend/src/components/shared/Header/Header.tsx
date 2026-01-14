import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import TopBar from "./TopBar";
import NavIcons from "./NavIcons";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Spacer to prevent layout jump */}
      <div
        className={`
          transition-all duration-300
          ${isScrolled ? "h-[72px] sm:h-20 md:h-[104px]" : "h-0"}
        `}
      />

      <header
        className={`
          w-full left-0 right-0 z-999
          transition-all duration-300 ease-in-out
          ${isScrolled ? "fixed top-0 shadow-lg bg-white" : "relative"}
        `}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* TopBar (hidden after scroll) */}
        {!isScrolled && <TopBar />}

        {/* Main Header */}
        <div className="bg-header text-white">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between gap-3 py-2 sm:py-3 md:py-5">

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="lg:hidden hover:bg-white/10 rounded-md p-1"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="w-7 h-7 sm:w-8 sm:h-8" />
                ) : (
                  <Menu className="w-7 h-7 sm:w-8 sm:h-8" />
                )}
              </button>

              {/* Logo */}
              <Link to="/" aria-label="Go to home" className="shrink-0">
                <img
                  src="/NazuMeah.svg"
                  alt="Malabar Gold & Diamonds"
                  className="h-9 sm:h-10 md:h-12 lg:h-14 w-auto object-contain transition-transform hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </Link>

              {/* Desktop Search */}
              <div className="hidden md:flex flex-1 max-w-3xl">
                <SearchBar />
              </div>

              {/* Mobile Search */}
              <button
                onClick={() => setIsMobileSearchOpen(prev => !prev)}
                className="md:hidden flex flex-col items-center hover:opacity-90"
                aria-label="Search"
              >
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8"
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
                <span className="text-xs sm:text-sm font-medium">
                  Search
                </span>
              </button>

              {/* Nav Icons */}
              <NavIcons />
            </div>

            {/* Mobile Search Bar */}
            {isMobileSearchOpen && (
              <div className="md:hidden pb-3">
                <SearchBar />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
