import { useState, useEffect } from "react"
import { Clock, MapPin, Phone, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getStores, type Store } from "@/api/stores"

// Fallback stores in case API fails
const FALLBACK_STORES: Array<Store> = [
  {
    id: "1",
    name: "NazuMeah Jewellers – Gulshan",
    city: "Dhaka",
    address: "Gulshan Avenue, Dhaka 1212",
    state: null,
    country: "Bangladesh",
    postal_code: "1212",
    phone: "+880 1234 567890",
    email: null,
    hours: "10:30 AM – 9:30 PM",
    latitude: 23.7925,
    longitude: 90.4078,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    is_active: true,
    created_at: "",
    updated_at: "",
  },
]

const StoreLocatorPage = () => {
  const { data: storesResponse, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: () => getStores(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const stores = storesResponse?.data?.length ? storesResponse.data : FALLBACK_STORES
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  // Set first store as selected when data loads
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0])
    }
  }, [stores, selectedStore])

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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-header" />
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`cursor-pointer bg-white rounded-2xl shadow-sm overflow-hidden border transition
                  ${selectedStore?.id === store.id ? "border-header" : "border-transparent hover:border-gray-200"}`}
              >
                {store.image_url && (
                  <img
                    src={store.image_url}
                    alt={store.name}
                    className="w-full h-40 object-cover"
                  />
                )}

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm">{store.name}</h3>
                  <p className="text-xs text-gray-600 flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5" /> {store.address}, {store.city}
                  </p>
                  {store.phone && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" /> {store.phone}
                    </p>
                  )}
                  {store.hours && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {store.hours}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
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
                src={`https://www.google.com/maps?q=${selectedStore.latitude},${selectedStore.longitude}&z=15&output=embed`}
              />
            )}
          </div>

          {/* SELECTED STORE DETAILS */}
          {selectedStore && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold">{selectedStore.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedStore.address}, {selectedStore.city}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {selectedStore.phone && (
                  <a
                    href={`tel:${selectedStore.phone}`}
                    className="px-4 py-2 rounded-full bg-header text-white text-sm"
                  >
                    Call Store
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
