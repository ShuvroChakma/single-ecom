interface JewelryOffer {
  id: number
  image: string
  mobileImage: string
  href?: string // future routing
}

const JewelryOffers = () => {
  const offers: Array<JewelryOffer> = [
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

  return (
    <section className="w-full bg-white py-10 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="relative overflow-hidden rounded-lg cursor-pointer"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default JewelryOffers
