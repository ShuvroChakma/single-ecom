
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Link,
  useRouter,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { getPublicSettings } from '@/api/settings'

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
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: defaultTitle },
        ...(defaultDesc ? [{ name: 'description', content: defaultDesc }] : []),
        { property: 'og:site_name', content: storeName },
        { property: 'og:title', content: defaultTitle },
        ...(defaultDesc ? [{ property: 'og:description', content: defaultDesc }] : []),
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: defaultTitle },
        ...(defaultDesc ? [{ name: 'twitter:description', content: defaultDesc }] : []),
      ],
      links: [{ rel: 'stylesheet', href: appCss }],
    }
  },
  errorComponent: RootError,
  shellComponent: RootDocument,
})

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
