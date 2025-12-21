import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import MyAccountPage from '@/components/shared/Profile/MyAccountPage'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/wishlist')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <MyAccountPage />
    <Footer />
    </div>
}
