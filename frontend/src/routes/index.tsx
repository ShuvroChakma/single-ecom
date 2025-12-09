import { createFileRoute } from '@tanstack/react-router'
import DataDisplay from '@/components/DataDisplay'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/utils/api-client'


export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const data = await apiClient.get("/v1/health/")

    return {
      "apiUrl": import.meta.env.VITE_API_URL,
      "apiTimeout": import.meta.env.VITE_API_TIMEOUT,
      "data": data
    }
  }
})

function App() {
  const { apiUrl, apiTimeout, data } = Route.useLoaderData()

  return (
    <div>
      <h1>Home</h1>
      <Button>Test Button</Button>
      <p>{apiUrl}</p>
      <p>{apiTimeout}</p>
      <DataDisplay data={data} />
    </div>
  )
}