import { createFileRoute } from '@tanstack/react-router'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import MetalPricesPage from '@/components/shared/Footer/MetalPrices'
import { getCurrentRates } from '@/api/rates'

export const Route = createFileRoute('/footer/metal-prices')({
  loader: async () => {
    try {
      const res = await getCurrentRates()
      return { data: res?.data ?? null }
    } catch {
      return { data: null }
    }
  },
  head: ({ loaderData }) => {
    const rates = loaderData?.data?.rates ?? []
    const gold22k = rates.find(r => r.metal_type === 'GOLD' && r.purity === '22K')
    const gold18k = rates.find(r => r.metal_type === 'GOLD' && r.purity === '18K')
    const silver = rates.find(r => r.metal_type === 'SILVER')

    const rateSnippet = gold22k
      ? `Gold 22K ৳${Number(gold22k.rate_per_gram).toLocaleString()}/g${gold18k ? `, 18K ৳${Number(gold18k.rate_per_gram).toLocaleString()}/g` : ''}${silver ? ` · Silver ৳${Number(silver.rate_per_gram).toLocaleString()}/g` : ''}`
      : null

    const title = rateSnippet
      ? `Today's Gold & Silver Rate | ${rateSnippet} | Nazu Meah Jewellers`
      : "Today's Gold & Silver Rate | Metal Prices | Nazu Meah Jewellers"

    const description = rateSnippet
      ? `Today's metal rates: ${rateSnippet}. Updated daily based on BAJUS market prices. Check current gold, silver jewellery rates per gram and tola in Bangladesh.`
      : "Check today's gold, silver and other metal jewellery rates updated daily based on BAJUS market prices. Current rates per gram and tola in BDT."

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'keywords', content: 'gold rate today Bangladesh, today gold price Bangladesh, BAJUS gold rate, jewellery gold price per gram, silver rate Bangladesh, sona r dam, gold tola price' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
      ],
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = Route.useLoaderData()
  return (
    <div>
      <Header />
      <MetalPricesPage data={data} />
      <Footer />
    </div>
  )
}
