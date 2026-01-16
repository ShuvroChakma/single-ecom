
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import CustomJewelleryForm from '@/components/shared/Footer/CustomJewellery'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/footer/custom-jewellery')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <CustomJewelleryForm />
    <Footer />
  </div>
}
