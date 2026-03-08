
import FAQPage from '@/components/shared/Footer/FAQ'
import Footer from '@/components/shared/Footer/Footer'
import Header from '@/components/shared/Header/Header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/footer/faq')({
  head: () => ({
    meta: [
      { title: 'FAQ | Nazu Meah Jewellers' },
      { name: 'description', content: 'Find answers to common questions about ordering, shipping, returns, jewellery care and more at Nazu Meah Jewellers.' },
      { property: 'og:title', content: 'FAQ | Nazu Meah Jewellers' },
      { property: 'og:description', content: 'Find answers to common questions about ordering, shipping, returns and jewellery care.' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <FAQPage />
    <Footer />
  </div>
}
