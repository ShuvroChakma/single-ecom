
import { createFileRoute } from '@tanstack/react-router'
import AboutUs from '@/components/shared/Footer/AboutUs'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/footer/about')({
  head: () => ({
    meta: [
      { title: 'About Us | Nazu Meah Jewellers' },
      { name: 'description', content: 'Learn about Nazu Meah Jewellers — our heritage, craftsmanship, and commitment to offering the finest jewellery in Bangladesh.' },
      { property: 'og:title', content: 'About Us | Nazu Meah Jewellers' },
      { property: 'og:description', content: 'Learn about Nazu Meah Jewellers — our heritage, craftsmanship, and commitment to the finest jewellery.' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <AboutUs />
    <Footer />
  </div>
}
