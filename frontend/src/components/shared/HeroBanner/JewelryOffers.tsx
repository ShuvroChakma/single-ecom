import { useQuery } from '@tanstack/react-query'
import { getSlides } from '@/api/slides'
import { SLIDE_POSITIONS } from '@/api/slidePositions'
import { getImageUrl } from '@/api/client'

interface JewelryOffer {
  id: number | string
  image: string
  mobileImage: string
  href?: string | null
}

const FALLBACK_OFFERS: Array<JewelryOffer> = [
  {
    id: 1,
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/dimaond-offer.jpg",
    mobileImage:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/Diamond-Offer-m.jpg",
  },
  {
    id: 2,
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/gold-offer.jpg",
    mobileImage:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/gold-offer-m.jpg",
  },
  {
    id: 3,
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/gemstone-offer.jpg",
    mobileImage:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/gemstone-offer-m1.jpg",
  },
  {
    id: 4,
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/uncut-offer.jpg",
    mobileImage:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/uncut-offer-m1.jpg",
  },
]

const JewelryOffers = () => {
  const { data } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.JEWELRY_OFFERS],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.JEWELRY_OFFERS } }),
    staleTime: 5 * 60 * 1000,
  })

  const offers = data?.success && data.data.length > 0
    ? data.data.map(s => ({
        id: s.id,
        image: getImageUrl(s.image_url, ''),
        mobileImage: getImageUrl(s.mobile_image_url || s.image_url, ''),
        href: s.link_url,
      }))
    : FALLBACK_OFFERS

  return (
    <section className="w-full bg-white py-10 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer) => (
            <a
              key={offer.id}
              href={offer.href || '#'}
              className="relative overflow-hidden rounded-lg cursor-pointer block"
            >
              {/* Mobile Image */}
              <img
                src={offer.mobileImage}
                alt="Jewellery offer mobile"
                loading="lazy"
                className="block sm:hidden w-full h-full object-contain bg-white"
              />

              {/* Desktop / Tablet Image */}
              <img
                src={offer.image}
                alt="Jewellery offer desktop"
                loading="lazy"
                className="hidden sm:block w-full h-full object-contain bg-white"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default JewelryOffers
