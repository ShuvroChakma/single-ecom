import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Carousel from '@/components/shared/HeroBanner/Carousel'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Carousel />
    </div>
  )
}
