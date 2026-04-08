import { TrendingUp, RefreshCw, Info } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import type { CurrentRatesResponse, DailyRate } from '@/api/rates'

interface MetalPricesPageProps {
  data: CurrentRatesResponse | null
}

const METAL_LABELS: Record<string, string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  PLATINUM: 'Platinum',
  PALLADIUM: 'Palladium',
}

const METAL_COLORS: Record<string, { bg: string; border: string; badge: string; icon: string }> = {
  GOLD:     { bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800',  icon: 'text-amber-500' },
  SILVER:   { bg: 'bg-slate-50',   border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-700',  icon: 'text-slate-500' },
  PLATINUM: { bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',    icon: 'text-blue-500' },
  PALLADIUM:{ bg: 'bg-purple-50',  border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800',icon: 'text-purple-500' },
}

const DEFAULT_COLORS = { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', icon: 'text-gray-500' }

// 1 tola = 11.664 grams
const GRAMS_PER_TOLA = 11.664

function groupByMetal(rates: DailyRate[]): Record<string, DailyRate[]> {
  return rates.reduce<Record<string, DailyRate[]>>((acc, rate) => {
    if (!acc[rate.metal_type]) acc[rate.metal_type] = []
    acc[rate.metal_type].push(rate)
    return acc
  }, {})
}

export default function MetalPricesPage({ data }: MetalPricesPageProps) {
  const rates = data?.rates ?? []
  const lastUpdated = data?.last_updated
  const grouped = groupByMetal(rates)
  const METAL_ORDER = ['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM']
  const metalTypes = Object.keys(grouped).sort(
    (a, b) => (METAL_ORDER.indexOf(a) + 1 || 99) - (METAL_ORDER.indexOf(b) + 1 || 99)
  )

  const jsonLd = rates.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: "Today's Metal Prices",
    description: 'Current gold, silver and other metal jewellery rates updated daily based on BAJUS market prices in Bangladesh.',
    ...(lastUpdated && { dateModified: lastUpdated }),
    mainEntity: {
      '@type': 'ItemList',
      name: 'Metal Rates',
      itemListElement: rates.map((rate, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${rate.metal_type} ${rate.purity}`,
        description: `${rate.metal_type} ${rate.purity} — ৳${Number(rate.rate_per_gram).toLocaleString()} per gram (${rate.currency})`,
      })),
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-header/10 text-header text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <TrendingUp size={13} />
            Live Market Rates
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Metal Prices</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Current jewellery metal rates updated daily based on BAJUS market prices.
          </p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
              <RefreshCw size={12} />
              Last updated: {formatDateTime(lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {metalTypes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No rates available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {metalTypes.map((metalType) => {
              const metalRates = grouped[metalType]
              const colors = METAL_COLORS[metalType] ?? DEFAULT_COLORS
              const label = METAL_LABELS[metalType] ?? metalType

              return (
                <div
                  key={metalType}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}
                >
                  {/* Metal header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-inherit">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.badge}`}>
                        <TrendingUp size={15} className={colors.icon} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">{label}</h2>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>
                      {metalRates[0]?.currency ?? 'BDT'}
                    </span>
                  </div>

                  {/* Rate table */}
                  <div className="divide-y divide-gray-100/70">
                    {/* Table header */}
                    <div className="grid grid-cols-3 px-6 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <span>Purity</span>
                      <span className="text-right">Per Gram</span>
                      <span className="text-right">Per Tola</span>
                    </div>

                    {metalRates.map((rate) => (
                      <div key={rate.id} className="grid grid-cols-3 px-6 py-4 items-center hover:bg-white/60 transition-colors">
                        <div>
                          <span className={`inline-block text-sm font-bold px-2.5 py-0.5 rounded-md ${colors.badge}`}>
                            {rate.purity}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-semibold text-gray-900">
                            ৳{Number(rate.rate_per_gram).toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-semibold text-gray-900">
                            ৳{(Number(rate.rate_per_gram) * GRAMS_PER_TOLA).toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p>
            Prices shown are indicative rates for reference only and may differ from final product prices.
            Final prices include making charges, taxes, and other applicable costs. Rates are subject to change
            without prior notice based on market conditions.
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
