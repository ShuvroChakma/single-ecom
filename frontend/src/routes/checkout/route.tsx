
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Checkout from '@/components/shared/Products/Checkout'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/checkout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <Checkout />
    <Footer />
  </div>
}
