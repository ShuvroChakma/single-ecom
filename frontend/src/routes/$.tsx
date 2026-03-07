import { createFileRoute, Link } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-8xl md:text-[10rem] font-bold text-header leading-none select-none">
          404
        </p>
        <h1 className="text-2xl md:text-3xl font-serif mt-4 mb-2 text-gray-900">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-sm md:text-base max-w-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-header text-white px-6 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </main>
      <Footer />
    </div>
  )
}
