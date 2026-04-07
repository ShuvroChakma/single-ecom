
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import SizeGuidePage from '@/components/shared/Footer/SizeGuide'

export const Route = createFileRoute('/footer/size-guide')({
  head: () => ({
    meta: [
      { title: 'Jewellery Size Guide | Nazu Meah Jewellers' },
      { name: 'description', content: 'Find your perfect fit with our jewellery size guide for rings, bangles and necklaces at Nazu Meah Jewellers.' },
      { property: 'og:title', content: 'Jewellery Size Guide | Nazu Meah Jewellers' },
      { property: 'og:description', content: 'Find your perfect fit with our jewellery size guide for rings, bangles and necklaces.' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <SizeGuidePage />
    <Footer />
  </div>
}
