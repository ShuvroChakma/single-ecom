
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import ProductLayout from '@/components/shared/Products/ProductLayout'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/products')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <ProductLayout />
    <Footer />
  </div>
}
