
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import SizeGuidePage from '@/components/shared/Footer/SizeGuide'

export const Route = createFileRoute('/footer/size-guide')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <SizeGuidePage />
    <Footer />
  </div>
}
