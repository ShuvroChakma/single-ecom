
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import TrackOrderPage from '@/components/shared/Footer/TrackMyOrder'

export const Route = createFileRoute('/footer/track-order')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <TrackOrderPage />
    <Footer />
  </div>
}
