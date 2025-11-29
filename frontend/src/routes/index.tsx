import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App, loader: () => {
  return {
    "apiUrl": import.meta.env.VITE_API_URL,
    "apiTimeout": import.meta.env.VITE_API_TIMEOUT
  }
} })

function App() {
  const { apiUrl, apiTimeout } = Route.useLoaderData()

  return (
    <div>
      <h1>Home</h1>
      <p>{apiUrl}</p>
      <p>{apiTimeout}</p>
    </div>
  )
}
