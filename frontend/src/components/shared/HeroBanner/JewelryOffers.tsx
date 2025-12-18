interface JewelryOffer {
  id: number
  title: string
  subtitle: string
  discount: string
  image: string
  bgColor?: string // optional CMS-controlled color
}

const JewelryOffers = () => {
  const offers: Array<JewelryOffer> = [
    {
      id: 1,
      title: 'Gold Jewellery',
      subtitle: '4900+ Unique design',
      discount: '30',
      image:
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1600&q=80',
      bgColor: 'bg-header',
    },
    {
      id: 2,
      title: 'Diamond Jewellery',
      subtitle: '1900+ Unique design',
      discount: '30',
      image:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&q=80',
      bgColor: 'bg-header',
    },
    {
      id: 3,
      title: 'Gemstone Jewellery',
      subtitle: '650+ Unique design',
      discount: '30',
      image:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&q=80',
      bgColor: 'bg-header',
    },
    {
      id: 4,
      title: 'Uncut Jewellery',
      subtitle: '480+ Unique design',
      discount: '30',
      image:
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1600&q=80',
      bgColor: 'bg-header',
    },
  ]

  return (
    <section className="w-full bg-white py-10 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="
                group relative overflow-hidden rounded-lg
                shadow-lg hover:shadow-2xl transition-all
                cursor-pointer
                h-56 md:h-auto md:aspect-5/6
              "
            >
              {/* Image */}
              <img
                src={offer.image}
                alt={offer.title}
                loading="lazy"
                className="
                  w-full h-full object-cover
                  md:group-hover:scale-110
                  transition-transform duration-600
                "
              />

              {/* Image gradient */}
              <div
                className="
                  absolute inset-0
                  bg-linear-to-r md:bg-linear-to-t
                  from-black/60 via-black/25 to-transparent
                "
              />

              {/* ================= DESKTOP (md → xl) ================= */}
              <div
                className={`
              hidden md:block absolute bottom-0 left-0 w-full
              ${offer.bgColor ?? 'bg-header'}
              text-white rounded-b-xl
              h-22 md:h-20 lg:h-22 xl:h-28
            `}
              >
                <div className="grid grid-cols-[40%_1px_60%] h-full px-2 lg:px-2 py-3">
                  {/* LEFT: OFFER */}
                  <div className="flex flex-col justify-start pr-2">
                    <p className="text-[9px] md:text-[9px] lg:text-[10px] uppercase tracking-wider">
                      UP TO
                    </p>

                    <div className="flex items-start leading-none">
                      <span className="text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
                        {offer.discount}
                      </span>

                      <div className="flex flex-col mt-2">
                        <span className="text-lg md:text-lg lg:text-xl xl:text-2xl leading-none">
                          %
                        </span>
                        <span className="text-[7px] md:text-[8px] lg:text-[8px] uppercase leading-none">
                          OFF
                        </span>
                      </div>
                    </div>

                    <p className="text-[8px] md:text-[8px] lg:text-[8px] uppercase tracking-wide">
                      ON DIAMOND VALUE
                    </p>
                  </div>

                  {/* DIVIDER */}
                  <div className="bg-white/30 my-3 lg:my-4" />

                  {/* RIGHT: INFO */}
                  <div className="flex flex-col justify-center pl-1 lg:pl-2">
                    <h3 className="text-sm md:text-sm lg:text-md xl:text-lg font-semibold whitespace-nowrap">
                      {offer.title}
                    </h3>

                    <p className="text-xs md:text-xs lg:text-xs text-white/90 whitespace-nowrap">
                      {offer.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= MOBILE (< md) ================= */}
              <div className="md:hidden absolute inset-0 flex items-end justify-end p-4">
                {/* soft contrast layer for text readability */}
                <div className="absolute inset-0 " />

                <div className="relative text-right text-white max-w-[70%]">
                  {/* UP TO */}
                  <p className="text-xs uppercase tracking-wider">UP TO</p>

                  {/* Discount */}
                  <div className="flex justify-end items-start leading-none mb-2">
                    <span className="text-6xl font-bold">{offer.discount}</span>

                    <div className="flex flex-col mt-2.5">
                      <span className="text-4xl font-bold leading-none">%</span>
                      <span className="text-[11px] font-semibold uppercase leading-none">
                        OFF
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-semibold leading-tight ">
                    {offer.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-sm text-white/90 leading-tight">
                    {offer.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default JewelryOffers
