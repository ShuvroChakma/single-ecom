import { createFileRoute, Link, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/__error')({
  component: ErrorPage,
})

function ErrorPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gray-50">
      <p className="text-6xl font-bold text-header mb-4">Oops</p>
      <h1 className="text-2xl font-serif mb-2 text-gray-900">Something went wrong</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        An unexpected error occurred. Please try again or go back to the homepage.
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
          className="px-5 py-2.5 bg-header text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
