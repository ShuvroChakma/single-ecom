
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import Diamond from '@/components/shared/Categories/Diamond'

export const Route = createFileRoute('/categories/Diamond')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <Diamond />
    <Footer />
  </div>
}
