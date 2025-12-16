import { Link } from "@tanstack/react-router";
import { Heart, MapPin, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";

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
    <span className="text-xs font-medium">{label}</span>
  </Link>
);

const countries = [
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", currency: "BDT" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  { code: "AE", name: "UAE", flag: "🇦🇪", currency: "AED" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD" },
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
      <div className="flex items-center gap-8 md:gap-10 lg:gap-12">

        {/* === LG+ ONLY ICONS === */}
        <div className="hidden lg:flex items-center gap-12">
          <NavIcon
            to="/stores"
            icon={<MapPin className="w-5 h-5" />}
            label="Stores"
          />

          {/* Country Selector */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center gap-1 text-primary-foreground hover:opacity-80 transition-all"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-lg leading-none">
                {selectedCountry.flag}
              </span>
            </div>
            <span className="text-xs font-medium">Country</span>
          </button>

          <NavIcon
            to="/profile"
            icon={<User className="w-5 h-5" />}
            label="Profile"
          />
        </div>

        {/* === ALWAYS VISIBLE (SM → LG+) === */}
        <NavIcon
          to="/wishlist"
          icon={<Heart className="w-5 h-5" />}
          label="Wishlist"
        />

        <NavIcon
          to="/cart"
          icon={<ShoppingCart className="w-5 h-5" />}
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
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
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-4xl">🇧🇩</span>
                  <span className="text-sm font-medium">BANGLADESH</span>
                </button>

                <button
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200"
                >
                  <span className="text-2xl">🌍</span>
                  <span className="text-sm font-medium">OTHER COUNTRIES</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
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
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
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
