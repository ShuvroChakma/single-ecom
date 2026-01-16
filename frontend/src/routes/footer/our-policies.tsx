
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'

import Footer from '@/components/shared/Footer/Footer'
import OurPolicies from '@/components/shared/Footer/Policies'

export const Route = createFileRoute('/footer/our-policies')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <OurPolicies />
    <Footer />
  </div>
}
