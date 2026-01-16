
import { createFileRoute } from '@tanstack/react-router'
import Login from '@/components/shared/Profile/Login' 
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <Login />
    <Footer />
    </div>
}
