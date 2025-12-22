import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Carousel from '@/components/shared/HeroBanner/Carousel'
import CategoryHero from '@/components/shared/HeroBanner/CategoryHero'
import Footer from '@/components/shared/Footer/Footer'
import JewelryOffers from '@/components/shared/HeroBanner/JewelryOffers'
import { HandPicked } from '@/components/shared/HeroBanner/HandPicked'
import { SilverCollection } from '@/components/shared/HeroBanner/SilverCollection'
import Gemstone from '@/components/shared/HeroBanner/Gemstone'
import PlatinumCollection from '@/components/shared/HeroBanner/PlatinumCollection'
import GoldJewellery from '@/components/shared/HeroBanner/GoldJewellery'



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
      <Gemstone />
      <PlatinumCollection />
      <GoldJewellery />
      <Footer />
    </div>
  )
}
