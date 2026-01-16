import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import StoreLocatorPage from '@/components/shared/Stores/StoreLocatorPage'
import Footer from '@/components/shared/Footer/Footer'


export const Route = createFileRoute('/stores')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <StoreLocatorPage />
    <Footer />
  </div>
}
