import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, MapPin, Package, ShoppingCart, User, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/api/cart";
import { useAuth } from "@/hooks/useAuth";

interface NavIconProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavIcon = ({ to, icon, label }: NavIconProps) => (
  <Link
    to={to}
    className="flex flex-col items-center gap-1 text-primary-foreground hover:text-accent-foreground hover:opacity-80 transition-all"
  >
    <div className="relative">
      {icon}
    </div>
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

const countries = [
  { code: "BD", name: "Bangladesh", flag: "https://flagcdn.com/w40/bd.png", currency: "BDT" },
  { code: "IN", name: "India", flag: "https://flagcdn.com/w40/in.png", currency: "INR" },
  { code: "US", name: "United States", flag: "https://flagcdn.com/w40/us.png", currency: "USD" },
  { code: "GB", name: "United Kingdom", flag: "https://flagcdn.com/w40/gb.png", currency: "GBP" },
  { code: "AE", name: "UAE", flag: "https://flagcdn.com/w40/ae.png", currency: "AED" },
  { code: "CA", name: "Canada", flag: "https://flagcdn.com/w40/ca.png", currency: "CAD" },
  { code: "AU", name: "Australia", flag: "https://flagcdn.com/w40/au.png", currency: "AUD" },
];

const currencies = [
  { code: "BDT", name: "Bangladesh (BDT)" },
  { code: "INR", name: "India (INR)" },
  { code: "USD", name: "United States (USD)" },
  { code: "GBP", name: "United Kingdom (GBP)" },
  { code: "AED", name: "UAE (AED)" },
  { code: "CAD", name: "Canada (CAD)" },
  { code: "AUD", name: "Australia (AUD)" },
];

const NavIcons = () => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current && !userMenuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggleUserMenu = () => {
    if (!isUserMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsUserMenuOpen((o) => !o);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate({ to: "/" });
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"
    : "";

  const { data: cartResponse } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const cartCount = cartResponse?.data?.item_count || 0;

  const handleCountrySelect = (country: typeof countries[number]) => {
    setSelectedCountry(country);
    const matchingCurrency = currencies.find(
      (c) => c.code === country.currency
    );
    if (matchingCurrency) {
      setSelectedCurrency(matchingCurrency.code);
    }
  };

  const handleApply = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 md:gap-10 lg:gap-14">

        {/* === LG+ ONLY ICONS === */}
        <div className="hidden lg:flex items-center gap-14">
          <NavIcon
            to="/stores"
            icon={<MapPin className="w-7 h-7" />}
            label="Stores"
          />

          {/* Country Selector */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center gap-0 text-primary-foreground hover:opacity-80 transition-all"
          >
            <div className="w-7 h-8 flex items-center justify-center">
              <img 
                src={selectedCountry.flag} 
                alt={selectedCountry.name}
                className="w-6 h-4 object-cover rounded-sm"
              />
            </div>
            <span className="text-sm font-semibold">Country</span>
          </button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div>
              <button
                ref={buttonRef}
                onClick={handleToggleUserMenu}
                className="flex flex-col items-center gap-1 text-primary-foreground hover:opacity-80 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="text-sm font-medium max-w-[80px] truncate">
                  {user.first_name}
                </span>
              </button>

              {isUserMenuOpen && typeof document !== "undefined" && createPortal(
                <div
                  ref={userMenuRef}
                  style={{ top: dropdownPos.top, right: dropdownPos.right }}
                  className="fixed w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[99999]"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Account
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Package className="w-4 h-4 text-gray-400" />
                    My Orders
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          ) : (
            <Link
              to="/profile"
              className="flex flex-col items-center gap-1 text-primary-foreground hover:opacity-80 transition-all"
            >
              <User className="w-7 h-7" />
              <span className="text-sm font-medium">Sign In</span>
            </Link>
          )}
        </div>

        {/* === ALWAYS VISIBLE (SM → LG+) === */}
        <NavIcon
          to="/wishlist"
          icon={<Heart className="w-6 h-7" />}
          label="Wishlist"
        />

        <NavIcon
          to="/cart"
          icon={
            <div className="relative">
              <ShoppingCart className="w-6 h-7" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
          }
          label="Cart"
        />
      </div>

      {/* === COUNTRY & CURRENCY MODAL === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-header/80 hover:text-header"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Change Country and Currency
            </h2>

            <div className="mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => handleCountrySelect(countries[0])}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 ${
                    selectedCountry.code === "BD"
                      ? "border-header bg-footer"
                      : "border-header"
                  }`}
                >
                  <img 
                    src="https://flagcdn.com/w80/bd.png" 
                    alt="Bangladesh"
                    className="w-16 h-12 object-cover rounded"
                  />
                  <span className="text-sm font-medium hover:cursor-pointer text-black">BANGLADESH</span>
                </button>

                <button
                  className="flex-1 flex flex-col items-center bg-white gap-2 p-4 rounded-lg border-2 border-header"
                >
                  <span className="text-4xl">🌍</span>
                  <span className="text-sm text-black font-medium hover:cursor-pointer">OTHER COUNTRIES</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-header mb-2">
                Select Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black border-header/50"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApply}
              className="w-full py-3 bg-header text-white rounded-lg font-semibold"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NavIcons;