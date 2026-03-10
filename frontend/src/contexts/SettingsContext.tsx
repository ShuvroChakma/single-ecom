import { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicSettings, SettingsGrouped, SiteSettings } from '@/api/settings'

const DEFAULTS: SiteSettings = {
  store_name: 'Jewellery Store',
  store_tagline: 'Exquisite Jewelry for Every Occasion',
  store_logo: '',
  store_favicon: '/favicon.ico',
  currency: 'BDT',
  currency_symbol: '৳',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  support_email: '',
  whatsapp_number: '',
  map_embed_url: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  twitter_url: '',
  pinterest_url: '',
  meta_title: '',
  meta_description: '',
  primary_color: '#D4AF37',
  secondary_color: '#1a1a1a',
  accent_color: '#C9A959',
  free_shipping_threshold: '5000',
  default_shipping_days_min: '3',
  default_shipping_days_max: '7',
}

const SettingsContext = createContext<SiteSettings>(DEFAULTS)

function flattenSettings(grouped: SettingsGrouped): SiteSettings {
  return {
    ...DEFAULTS,
    ...grouped.general,
    ...grouped.contact,
    ...grouped.social,
    ...grouped.shipping,
    ...grouped.seo,
    ...grouped.appearance,
  }
}

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode
  initialSettings?: SettingsGrouped | null
}) {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getPublicSettings(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    initialData: initialSettings
      ? { success: true as const, data: initialSettings, message: '' }
      : undefined,
  })

  const settings: SiteSettings = data?.success
    ? flattenSettings(data.data)
    : DEFAULTS

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
