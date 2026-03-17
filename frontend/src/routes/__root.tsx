
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { useEffect } from 'react'

import appCss from '../styles.css?url'
import { getPublicSettings } from '@/api/settings'
import { SettingsProvider } from '@/contexts/SettingsContext'

import type { QueryClient } from '@tanstack/react-query'



interface MyRouterContext {
  queryClient: QueryClient
}

function RootError() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gray-50">
      <p className="text-6xl font-bold text-red-500 mb-4">Oops</p>
      <h1 className="text-2xl font-serif mb-2 text-gray-900">Something went wrong</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.history.back()}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Go Back
        </button>
        <Link
          to="/"
          className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  staleTime: 30 * 60 * 1000,
  loader: async ({ context: { queryClient } }) => {
    try {
      const data = await queryClient.ensureQueryData({
        queryKey: ['site-settings'],
        queryFn: () => getPublicSettings(),
        staleTime: 30 * 60 * 1000,
      })
      return { settings: data?.success ? data.data : null }
    } catch {
      return { settings: null }
    }
  },
  head: ({ loaderData }) => {
    const general = loaderData?.settings?.general ?? {}
    const seo = loaderData?.settings?.seo ?? {}
    const storeName = general.store_name || 'Nazu Meah Jewellers'
    const defaultTitle = seo.meta_title || storeName
    const defaultDesc = seo.meta_description || ''
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://nazumeahjewellers.com'
    const gaId = seo.google_analytics_id || ''
    const pixelId = seo.facebook_pixel_id || ''
    const logo = general.logo ? `${import.meta.env.VITE_API_URL || ''}/static/uploads/${general.logo}` : ''

    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'JewelryStore',
      name: storeName,
      url: siteUrl,
      ...(logo ? { logo } : {}),
      ...(general.phone ? { telephone: general.phone } : {}),
      ...(general.email ? { email: general.email } : {}),
      ...(general.address ? { address: { '@type': 'PostalAddress', streetAddress: general.address } } : {}),
    }

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: defaultTitle },
        ...(defaultDesc ? [{ name: 'description', content: defaultDesc }] : []),
        { property: 'og:site_name', content: storeName },
        { property: 'og:title', content: defaultTitle },
        { property: 'og:url', content: siteUrl },
        ...(defaultDesc ? [{ property: 'og:description', content: defaultDesc }] : []),
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: defaultTitle },
        ...(defaultDesc ? [{ name: 'twitter:description', content: defaultDesc }] : []),
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'canonical', href: siteUrl },
      ],
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(orgSchema) },
        ...(gaId ? [
          { src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true },
          { children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');` },
        ] : []),
        ...(pixelId ? [
          { children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');` },
        ] : []),
      ],
    }
  },
  component: RootComponent,
  errorComponent: RootError,
  shellComponent: RootDocument,
})

function RootComponent() {
  const { settings } = Route.useLoaderData()
  const router = useRouter()
  const gaId = settings?.seo?.google_analytics_id
  const pixelId = settings?.seo?.facebook_pixel_id

  useEffect(() => {
    if (!gaId && !pixelId) return
    return router.subscribe('onResolved', () => {
      if (typeof window !== 'undefined') {
        if (gaId && (window as any).gtag) {
          ;(window as any).gtag('event', 'page_view', {
            page_location: window.location.href,
            page_path: window.location.pathname,
          })
        }
        if (pixelId && (window as any).fbq) {
          ;(window as any).fbq('track', 'PageView')
        }
      }
    })
  }, [router, gaId, pixelId])

  return (
    <SettingsProvider initialSettings={settings}>
      <Outlet />
    </SettingsProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
