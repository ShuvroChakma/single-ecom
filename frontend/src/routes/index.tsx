import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Carousel from '@/components/shared/HeroBanner/Carousel'
import CategoryHero from '@/components/shared/HeroBanner/CategoryHero'
import Footer from '@/components/shared/Footer/Footer'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Carousel />
      <CategoryHero />

      <Footer />
    </div>
  )
}
