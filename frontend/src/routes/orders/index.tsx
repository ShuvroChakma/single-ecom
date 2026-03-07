import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import MyAccountPage from '@/components/shared/Profile/MyAccountPage'

export const Route = createFileRoute('/orders/')({
  component: OrdersPage,
})

function OrdersPage() {
  return (
    <div>
      <Header />
      <MyAccountPage initialSection="orders" />
      <Footer />
    </div>
  )
}
