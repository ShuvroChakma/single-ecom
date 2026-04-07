
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'

import Footer from '@/components/shared/Footer/Footer'
import OurPolicies from '@/components/shared/Footer/Policies'

export const Route = createFileRoute('/footer/our-policies')({
  head: () => ({
    meta: [
      { title: 'Our Policies | Nazu Meah Jewellers' },
      { name: 'description', content: 'Read our shipping, return, refund and privacy policies at Nazu Meah Jewellers.' },
      { property: 'og:title', content: 'Our Policies | Nazu Meah Jewellers' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <OurPolicies />
    <Footer />
  </div>
}
