import { createFileRoute } from '@tanstack/react-router'

const getBackendUrl = () => {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  return apiUrl.replace(/\/api\/v1\/?$/, '')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(`${getBackendUrl()}/sitemap.xml`)
        const xml = await response.text()

        return new Response(xml, {
          status: response.status,
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
