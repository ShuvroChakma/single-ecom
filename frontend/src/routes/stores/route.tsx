import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import CategoryNav from '@/components/shared/Header/CategoryNav'
import StoreLocatorPage from '@/components/shared/Stores/StoreLocatorPage'
import Footer from '@/components/shared/Footer/Footer'


export const Route = createFileRoute('/stores')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <CategoryNav />
    <StoreLocatorPage />
    <Footer />
  </div>
}
