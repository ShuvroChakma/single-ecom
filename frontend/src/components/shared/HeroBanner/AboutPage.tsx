import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { getSlides } from '@/api/slides';
import { SLIDE_POSITIONS } from '@/api/slidePositions';
import { getImageUrl } from '@/api/client';
import { useSettings } from '@/contexts/SettingsContext'

interface AboutStoreData {
  imageUrl: string;
  phoneDescription: string;
  goldSchemeTitle: string;
  goldSchemeDescription: string;
  goldSchemeLink: string;
  goldRateTitle: string;
  goldRateDescription: string;
  goldRateLink: string;
}

const FALLBACK_IMAGE = 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/ind-homepage/410-Showroom.jpeg'

const AboutPage: React.FC = () => {
  const { contact_phone } = useSettings()

  const { data } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.ABOUT_SHOWROOM],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.ABOUT_SHOWROOM } }),
    staleTime: 5 * 60 * 1000,
  })

  const showroomImage =
    data?.success && data.data.length > 0
      ? getImageUrl(data.data[0].image_url, FALLBACK_IMAGE)
      : FALLBACK_IMAGE

  // Data from backend
  const storeData: AboutStoreData = {
    imageUrl: showroomImage,
    phoneDescription: 'For store queries and schemes',
    goldSchemeTitle: 'GOLD SCHEME',
    goldSchemeDescription: 'Easy monthly payment plans',
    goldSchemeLink: '#',
    goldRateTitle: 'GOLD RATE',
    goldRateDescription: 'Best rate, updated daily!',
    goldRateLink: '/footer/metal-prices'
  };

  const displayPhone = contact_phone || '9562-916-916'

  return (
    <div className="w-full bg-white py-6 px-2 sm:px-2 lg:px-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">About Our Store</h1>
          <p className="text-gray-700 text-sm md:text-base">
            Get in touch with us for a complete jewellery shopping experience!
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-[55%_45%] gap-2 md:gap-2 lg:gap-2">
          {/* Left Section - Showroom Image */}
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={storeData.imageUrl}
              alt="Our Showroom"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Section - Info Cards */}
          <div className="flex flex-col gap-4 md:gap-5">
            {/* Phone Number Card */}
            <div className="bg-footer rounded-lg p-6 md:p-8 lg:p-10 text-center flex-1 flex flex-col justify-center">
              <a href={`tel:${displayPhone}`}>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-header mb-2 md:mb-3">
                  {displayPhone}
                </h2>
              </a>
              <p className="text-gray-800 text-sm md:text-base">
                {storeData.phoneDescription}
              </p>
            </div>

            {/* Gold Scheme and Gold Rate Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-5 flex-1">
              {/* Gold Scheme Card */}
              <div className="bg-footer rounded-lg p-2 md:p-4 text-center flex flex-col justify-center">
                <div className="mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {storeData.goldSchemeTitle}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-800 leading-relaxed">
                    {storeData.goldSchemeDescription}
                  </p>
                </div>
                <a
                  href={storeData.goldSchemeLink}
                  className="text-header font-semibold text-sm md:text-base hover:underline"
                >
                  Pay Online
                </a>
              </div>

              {/* Gold Rate Card */}
              <div className="bg-footer rounded-lg p-4 md:p-6 text-center flex flex-col justify-center">
                <div className="mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {storeData.goldRateTitle}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-800 leading-relaxed">
                    {storeData.goldRateDescription}
                  </p>
                </div>
                <Link
                  to={storeData.goldRateLink}
                  className="text-header font-semibold text-sm md:text-base hover:underline"
                >
                  View Gold Rate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
