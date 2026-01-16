
import { createFileRoute } from '@tanstack/react-router'
import AboutUs from '@/components/shared/Footer/AboutUs'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/footer/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <AboutUs />
    <Footer />
  </div>
}
