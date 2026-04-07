import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import StoreLocatorPage from '@/components/shared/Stores/StoreLocatorPage'
import Footer from '@/components/shared/Footer/Footer'


export const Route = createFileRoute('/stores')({
  head: () => ({
    meta: [
      { title: 'Our Stores | Nazu Meah Jewellers' },
      { name: 'description', content: 'Find a Nazu Meah Jewellers store near you. View locations, contact details and opening hours.' },
      { property: 'og:title', content: 'Our Stores | Nazu Meah Jewellers' },
      { property: 'og:description', content: 'Find a Nazu Meah Jewellers store near you. View locations, contact details and opening hours.' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <StoreLocatorPage />
    <Footer />
  </div>
}
