import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"

const StoreLocatorPage = () => {
  const {
    store_name,
    contact_address,
    contact_phone,
    contact_email,
    whatsapp_number,
    map_embed_url,
  } = useSettings()

  return (
    <div className="w-full bg-gray-50">
      {/* PAGE HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">Store Locator</h1>
          <p className="text-gray-600 mt-1">Find {store_name} showroom near you</p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STORE INFO */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <h2 className="text-lg font-semibold">{store_name}</h2>

            {contact_address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-header" />
                <span>{contact_address}</span>
              </div>
            )}

            {contact_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 shrink-0 text-header" />
                <a href={`tel:${contact_phone}`} className="hover:underline">
                  {contact_phone}
                </a>
              </div>
            )}

            {contact_email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 shrink-0 text-header" />
                <a href={`mailto:${contact_email}`} className="hover:underline">
                  {contact_email}
                </a>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 shrink-0 text-header" />
              <span>10:30 AM – 9:30 PM (Sat–Thu)</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {contact_phone && (
                <a
                  href={`tel:${contact_phone}`}
                  className="px-4 py-2 rounded-full bg-header text-white text-sm"
                >
                  Call Store
                </a>
              )}
              {whatsapp_number && (
                <a
                  href={`https://wa.me/${whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* MAP */}
        <div className="lg:col-span-2">
          <div className="w-full h-[420px] rounded-2xl overflow-hidden bg-gray-200">
            {map_embed_url ? (
              <iframe
                title="Store Location"
                src={map_embed_url}
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                <MapPin className="w-5 h-5 mr-2" />
                No map location set
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreLocatorPage
