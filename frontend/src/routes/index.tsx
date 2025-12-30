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
import OurCollection from '@/components/shared/HeroBanner/OurCollection'
import OneDayShipping from '@/components/shared/HeroBanner/OneDayShipping'
import ShopByGender from '@/components/shared/HeroBanner/ShopByGender'
import NewArrivals from '@/components/shared/HeroBanner/NewArrivals'
import GiftingPage from '@/components/shared/HeroBanner/GiftingPage'
import AboutPage from '@/components/shared/HeroBanner/AboutPage'
import CategoryNav from '@/components/shared/Header/CategoryNav'




export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div>
      <Header />
      <CategoryNav />
      <Carousel />
      <CategoryHero />
      <JewelryOffers />
      <HandPicked />
      <SilverCollection />
      <Gemstone />
      <PlatinumCollection />
      <GoldJewellery />
      <OurCollection />
      <OneDayShipping />
      <ShopByGender />
      <NewArrivals />
      <GiftingPage />
      <AboutPage />
      
      <Footer />
    </div>
  )
}
