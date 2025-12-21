import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Carousel from '@/components/shared/HeroBanner/Carousel'
import CategoryHero from '@/components/shared/HeroBanner/CategoryHero'
import Footer from '@/components/shared/Footer/Footer'
import JewelryOffers from '@/components/shared/HeroBanner/JewelryOffers'
import { HandPicked } from '@/components/shared/HeroBanner/Handpicked'
import { SilverCollection } from '@/components/shared/HeroBanner/SilverCollection'



export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Carousel />
      <CategoryHero />
      <JewelryOffers />
      <HandPicked />
      <SilverCollection />
      <Footer />
    </div>
  )
}
