import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Gift, Mail, User, MessageSquare, Store, Phone, Check, ChevronRight, Star } from 'lucide-react'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import { useSettings } from '@/contexts/SettingsContext'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/gift-cards/')({
  head: () => ({
    meta: [
      { title: 'Gift Cards | Nazu Meah Jewellers' },
      {
        name: 'description',
        content:
          'Give the gift of timeless jewellery. Purchase a Nazu Meah Jewellers gift card and let your loved ones choose their perfect piece.',
      },
      { property: 'og:title', content: 'Gift Cards | Nazu Meah Jewellers' },
      {
        property: 'og:description',
        content:
          'Give the gift of timeless jewellery. Purchase a Nazu Meah Jewellers gift card.',
      },
    ],
  }),
  component: GiftCardsPage,
})

const DENOMINATIONS = [
  { value: 500, label: '৳500', popular: false },
  { value: 1000, label: '৳1,000', popular: true },
  { value: 2000, label: '৳2,000', popular: false },
  { value: 5000, label: '৳5,000', popular: false },
]

const FEATURES = [
  {
    icon: Gift,
    title: 'Perfect for Any Occasion',
    description: 'Birthdays, anniversaries, Eid, weddings — a gift card never misses.',
  },
  {
    icon: Star,
    title: 'No Expiry Worries',
    description: 'Our gift cards are valid for 12 months from the date of purchase.',
  },
  {
    icon: Store,
    title: 'Redeemable In-Store',
    description: 'Use your gift card at any of our Bajus Jewellery showrooms across Bangladesh.',
  },
]

function GiftCardsPage() {
  const { whatsapp_number, contact_phone, contact_email, store_name } = useSettings()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')

  const whatsappNumber = (whatsapp_number || contact_phone || '').replace(/\D/g, '')

  const buildWhatsAppMessage = () => {
    const amount = selectedAmount ? `৳${selectedAmount.toLocaleString('en-BD')}` : 'a gift card'
    const lines: string[] = [
      `Hello! I would like to request a *Gift Card* worth *${amount}* from ${store_name || 'your store'}.`,
    ]
    if (recipientName) lines.push(`\nRecipient Name: ${recipientName}`)
    if (recipientEmail) lines.push(`Recipient Email: ${recipientEmail}`)
    if (message) lines.push(`\nPersonal Message:\n"${message}"`)
    lines.push('\nPlease let me know how I can complete the purchase. Thank you!')
    return encodeURIComponent(lines.join('\n'))
  }

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${buildWhatsAppMessage()}`
    : null

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-header via-[#7a0044] to-top_bar overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-white/90 text-sm font-medium mb-5">
                <Gift size={14} />
                Bajus Jewellery Gift Cards
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white leading-tight mb-4">
                Give the Gift of
                <br />
                <span className="text-yellow-200">Timeless Jewellery</span>
              </h1>
              <p className="text-white/80 text-base md:text-lg max-w-lg leading-relaxed">
                Let your loved ones choose the jewellery they truly desire. Our gift cards are the most thoughtful way to celebrate every milestone.
              </p>
              <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-center gap-1.5 text-white/75 text-sm">
                    <Check size={13} className="text-yellow-300 shrink-0" />
                    {f.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Gift Card Visual */}
            <div className="shrink-0 w-full max-w-xs md:max-w-sm">
              <div className="relative">
                {/* Card shadow layer */}
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-black/20 blur-sm" />
                {/* Main card */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 p-6 md:p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-yellow-900/60 text-xs font-medium uppercase tracking-widest mb-1">Gift Card</p>
                        <p className="text-yellow-900 font-serif text-xl font-bold">
                          {store_name || 'Nazu Meah Jewellers'}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-yellow-900/15 rounded-full flex items-center justify-center">
                        <Gift size={20} className="text-yellow-900" />
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-yellow-900/60 text-xs mb-1">Value</p>
                      <p className="text-yellow-900 text-3xl font-bold">
                        {selectedAmount ? `৳${selectedAmount.toLocaleString('en-BD')}` : 'Select amount'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-900/50 text-xs">Valid for 12 months</p>
                        <p className="text-yellow-900/70 text-xs mt-0.5">Redeemable at any store</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-1.5 h-5 bg-yellow-900/20 rounded-full" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-900 px-6 py-3 flex items-center justify-between">
                    <p className="text-yellow-400/80 text-xs font-mono tracking-widest">**** **** **** ****</p>
                    <div className="w-6 h-4 rounded-sm bg-yellow-400/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-header transition-colors">Home</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-900 font-medium">Gift Cards</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-start">

          {/* Left: Denomination + Form */}
          <div className="space-y-8">

            {/* Denomination Selector */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Select Amount</h2>
              <p className="text-gray-500 text-sm mb-5">Choose the value of your gift card</p>
              <div className="grid grid-cols-2 gap-3">
                {DENOMINATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedAmount(d.value)}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-2xl border-2 py-6 px-4 transition-all duration-200 cursor-pointer group',
                      selectedAmount === d.value
                        ? 'border-header bg-header/5 shadow-md shadow-header/10'
                        : 'border-gray-200 bg-white hover:border-header/40 hover:shadow-sm'
                    )}
                  >
                    {d.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-header text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                        Most Popular
                      </span>
                    )}
                    <span className={cn(
                      'text-2xl font-bold transition-colors',
                      selectedAmount === d.value ? 'text-header' : 'text-gray-800 group-hover:text-header'
                    )}>
                      {d.label}
                    </span>
                    {selectedAmount === d.value && (
                      <span className="mt-2 w-5 h-5 rounded-full bg-header flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Recipient Details</h2>
              <p className="text-gray-500 text-sm mb-5">All fields are optional — fill in as much as you like</p>

              <div className="space-y-4">
                {/* Recipient Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <User size={14} className="text-gray-400" />
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Fatima Rahman"
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors"
                  />
                </div>

                {/* Recipient Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail size={14} className="text-gray-400" />
                    Recipient Email
                    <span className="text-gray-400 font-normal">(we'll email the card)</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. fatima@example.com"
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors"
                  />
                </div>

                {/* Personal Message */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <MessageSquare size={14} className="text-gray-400" />
                    Personal Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a heartfelt message to accompany the gift card..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{message.length}/500 characters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary + CTA */}
          <div className="lg:sticky lg:top-8 space-y-5">

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-5">Order Summary</h3>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gift Card Value</span>
                  <span className="font-semibold text-gray-900">
                    {selectedAmount ? `৳${selectedAmount.toLocaleString('en-BD')}` : '—'}
                  </span>
                </div>
                {recipientName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">For</span>
                    <span className="font-medium text-gray-700">{recipientName}</span>
                  </div>
                )}
                {recipientEmail && (
                  <div className="flex items-start justify-between text-sm gap-4">
                    <span className="text-gray-600 shrink-0">Delivery</span>
                    <span className="font-medium text-gray-700 text-right break-all">{recipientEmail}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-header">
                    {selectedAmount ? `৳${selectedAmount.toLocaleString('en-BD')}` : '৳—'}
                  </span>
                </div>
              </div>

              {/* Purchase Button */}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                    selectedAmount
                      ? 'bg-[#25D366] hover:bg-[#20bf5b] shadow-md shadow-green-500/20 active:scale-[0.98]'
                      : 'bg-gray-300 cursor-not-allowed pointer-events-none'
                  )}
                >
                  {/* WhatsApp icon */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Request via WhatsApp
                </a>
              ) : (
                <a
                  href={`mailto:${contact_email || 'info@bajusjewellery.com'}?subject=Gift Card Request — ৳${selectedAmount || ''}&body=Hello, I would like to purchase a gift card worth ৳${selectedAmount || ''}.`}
                  className={cn(
                    'flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                    selectedAmount
                      ? 'bg-header hover:bg-header/90 shadow-md active:scale-[0.98]'
                      : 'bg-gray-300 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <Mail size={18} />
                  Request Gift Card
                </a>
              )}

              <p className="text-xs text-gray-400 text-center mt-3">
                Our team will confirm your order and process payment within 24 hours.
              </p>
            </div>

            {/* In-store note */}
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Store size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-0.5">Available at our stores</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Gift cards can also be purchased in person at any{' '}
                  <Link to="/stores" className="underline underline-offset-2 hover:text-amber-900 transition-colors">
                    Bajus Jewellery showroom
                  </Link>
                  . Visit us and our team will assist you.
                </p>
              </div>
            </div>

            {/* Contact note */}
            {contact_phone && (
              <div className="flex gap-3 bg-header/5 border border-header/15 rounded-xl p-4">
                <Phone size={18} className="text-header shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">Need help?</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Call us at{' '}
                    <a href={`tel:${contact_phone}`} className="text-header font-medium hover:underline">
                      {contact_phone}
                    </a>{' '}
                    and we'll guide you through the purchase process.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-gray-50 border-t border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-3">Why Choose a Gift Card?</h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
              The most versatile and meaningful gift — let them pick exactly what they love.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 rounded-full bg-header/8 flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={22} className="text-header" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-sm md:text-base">Simple steps to gift the joy of jewellery</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                step: '01',
                title: 'Choose an Amount',
                desc: 'Select a denomination that suits your budget — from ৳500 to ৳5,000.',
              },
              {
                step: '02',
                title: 'Request via WhatsApp',
                desc: "Send us your request and we'll confirm the order and process payment.",
              },
              {
                step: '03',
                title: 'Gift Card Delivered',
                desc: 'Receive your physical or digital gift card to give to your loved one.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-header to-top_bar flex items-center justify-center mb-4 shadow-md shadow-header/20">
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-header to-top_bar py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-3">
            Ready to Spread the Joy?
          </h2>
          <p className="text-white/75 text-sm md:text-base mb-8">
            Select your amount above and send us a WhatsApp message to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 bg-white text-header font-semibold px-7 py-3 rounded-xl hover:bg-yellow-50 transition-colors shadow-md"
            >
              <Gift size={16} />
              Get a Gift Card
            </button>
            <Link
              to="/stores"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white font-medium px-7 py-3 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Store size={16} />
              Find a Store
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
