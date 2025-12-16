import { Link } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { name: "Diamond", path: "/category/diamond" },
    { name: "Gold", path: "/category/gold" },
    { name: "Gemstone", path: "/category/gemstone" },
    { name: "Uncut Diamond", path: "/category/uncut-diamond" },
    { name: "Platinum", path: "/category/platinum" },
    { name: "Gold Coins", path: "/category/gold-coins" },
    { name: "Silver", path: "/category/silver" },
    { name: "Watches", path: "/category/watches" },
    { name: "Gifts", path: "/category/gifts" },
    { name: "Jewellery", path: "/category/jewellery" },
    { name: "Gift Cards", path: "/category/gift-cards" },
    { name: "Gold Rate", path: "/gold-rate" },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div className="absolute left-0 top-0 h-full w-full max-w-[280px] sm:max-w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        
        {/* Header */}
        <div className="bg-header text-white px-4 py-3.5 flex items-center gap-3 shrink-0 shadow-sm">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Malabar Gold & Diamonds"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 bg-white overflow-y-auto">
          <nav className="py-1">
            {categories.map((category, index) => (
              <Link
                key={category.name}
                to={category.path}
                onClick={onClose}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  index < categories.length - 1 ? 'border-b border-gray-100' : ''
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
        <div className="bg-[#F5F5DC] px-4 py-5 shrink-0 border-t border-gray-200">
          {/* Auth Buttons */}
          <div className="flex gap-3 mb-5">
            <Link
              to="/account/login"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[#C41E8C] text-white rounded-md text-center text-sm font-semibold hover:bg-[#A01873] active:bg-[#8B1464] transition-colors shadow-sm"
            >
              Login
            </Link>
            <Link
              to="/account/signup"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[#C41E8C] text-white rounded-md text-center text-sm font-semibold hover:bg-[#A01873] active:bg-[#8B1464] transition-colors shadow-sm"
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
  );
};

export default MobileMenu;