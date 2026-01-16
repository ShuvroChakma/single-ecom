
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import FAQPage from '@/components/shared/Footer/FAQ'

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
