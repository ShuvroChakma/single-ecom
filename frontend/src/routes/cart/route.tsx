

import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import ShoppingCart from '@/components/shared/Profile/ShoppingCart'

export const Route = createFileRoute('/cart')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <ShoppingCart />

    <Footer />

    </div>
}
