import { useState } from "react"
import { Clock, MapPin, Phone  } from "lucide-react"

// =====================
// TYPES
// =====================

interface Store {
  id: number
  name: string
  city: string
  address: string
  phone: string
  hours: string
  image: string // comes from backend
  lat: number
  lng: number
}

// =====================
// MOCK DATA (replace with backend)
// =====================

const STORES: Array<Store> = [
  {
    id: 1,
    name: "NazuMeah Jewellers – Gulshan",
    city: "Dhaka",
    address: "Gulshan Avenue, Dhaka 1212",
    phone: "+880 1234 567890",
    hours: "10:30 AM – 9:30 PM",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    lat: 23.7925,
    lng: 90.4078,
  },
  {
    id: 2,
    name: "NazuMeah Jewellers – Chittagong",
    city: "Chittagong",
    address: "GEC Circle, Chittagong",
    phone: "+880 1987 654321",
    hours: "10:30 AM – 9:30 PM",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    lat: 22.3569,
    lng: 91.7832,
  },
]

// =====================
// PAGE
// =====================

const StoreLocatorPage = () => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(STORES[0])

  return (
    <div className="w-full bg-gray-50">
      {/* PAGE HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">Store Locator</h1>
          <p className="text-gray-600 mt-1">
            Find NazuMeah Jewellers showroom near you
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-2 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STORE LIST */}
        <div className="lg:col-span-1 space-y-4">
          {STORES.map((store) => (
            <div
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className={`cursor-pointer bg-white rounded-2xl shadow-sm overflow-hidden border transition
                ${selectedStore?.id === store.id ? "border-header" : "border-transparent hover:border-gray-200"}`}
            >
              <img
                src={store.image}
                alt={store.name}
                className="w-full h-40 object-cover"
              />

              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm">{store.name}</h3>
                <p className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin className="w-4 h-4 mt-0.5" /> {store.address}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {store.phone}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {store.hours}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* MAP + DETAILS */}
        <div className="lg:col-span-2 space-y-4">
          {/* MAP */}
          <div className="w-full h-[420px] rounded-2xl overflow-hidden bg-gray-200">
            {selectedStore && (
              <iframe
                title="Google Map"
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${selectedStore.lat},${selectedStore.lng}&z=15&output=embed`}
              />
            )}
          </div>

          {/* SELECTED STORE DETAILS */}
          {selectedStore && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold">{selectedStore.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedStore.address}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`tel:${selectedStore.phone}`}
                  className="px-4 py-2 rounded-full bg-header text-white text-sm"
                >
                  Call Store
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.lat},${selectedStore.lng}`}
                  target="_blank"
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm"
                >
                  Get Directions
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StoreLocatorPage
