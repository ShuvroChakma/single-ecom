import { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicSettings, SiteSettings } from '@/api/settings'

const DEFAULTS: SiteSettings = {
  store_name: 'Jewellery Store',
  store_tagline: 'Exquisite Jewelry for Every Occasion',
  store_logo: '/NazuMeah.svg',
  store_favicon: '/favicon.ico',
  currency: 'BDT',
  currency_symbol: '৳',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  support_email: '',
  whatsapp_number: '',
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getPublicSettings(),
    staleTime: 5 * 60 * 1000,
  })

  const settings: SiteSettings = data?.success
    ? {
        ...DEFAULTS,
        ...data.data.general,
        ...data.data.contact,
        ...data.data.social,
        ...data.data.shipping,
        ...data.data.seo,
        ...data.data.appearance,
      }
    : DEFAULTS

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
