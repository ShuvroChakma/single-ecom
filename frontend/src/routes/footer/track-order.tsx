
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import TrackOrderPage from '@/components/shared/Footer/TrackMyOrder'

export const Route = createFileRoute('/footer/track-order')({
  head: () => ({
    meta: [
      { title: 'Track Your Order | Nazu Meah Jewellers' },
      { name: 'description', content: 'Track your jewellery order status in real time at Nazu Meah Jewellers.' },
      { property: 'og:title', content: 'Track Your Order | Nazu Meah Jewellers' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <TrackOrderPage />
    <Footer />
  </div>
}
