
import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import CustomJewelleryForm from '@/components/shared/Footer/CustomJewellery'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/footer/custom-jewellery')({
  head: () => ({
    meta: [
      { title: 'Build Your Custom Jewellery | Nazu Meah Jewellers' },
      { name: 'description', content: 'Design your dream jewellery with Nazu Meah Jewellers. Choose your metal, style and budget — we craft it just for you.' },
      { property: 'og:title', content: 'Build Your Custom Jewellery | Nazu Meah Jewellers' },
      { property: 'og:description', content: 'Design your dream jewellery with Nazu Meah Jewellers. Choose your metal, style and budget — we craft it just for you.' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Header />
    <CustomJewelleryForm />
    <Footer />
  </div>
}
