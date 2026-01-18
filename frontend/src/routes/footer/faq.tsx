
import FAQPage from '@/components/shared/Footer/FAQ'
import Footer from '@/components/shared/Footer/Footer'
import Header from '@/components/shared/Header/Header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/footer/faq')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <FAQPage />
    <Footer />
  </div>
}
