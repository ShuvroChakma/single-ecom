import { useState } from 'react'
import { Mail, Minus, Phone, Plus } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaWhatsapp,
  FaXTwitter,
} from 'react-icons/fa6'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links?: Array<FooterLink>
  isCustomerService?: boolean
}

interface SocialLink {
  icon: typeof FaFacebookF
  href: string
  label: string
}

const FOOTER_SECTIONS: Array<FooterSection> = [
  {
    title: 'Get To Know Us',
    links: [
      { label: 'About Us', href: '/footer/about' },
      { label: 'Our Stores', href: '/stores' },
    ],
  },
  {
    title: 'Let Us Help You',
    links: [
      { label: 'FAQ', href: '/footer/faq' },
      { label: 'Track My Order', href: '/footer/track-order' },
      { label: 'Size Guide', href: '/footer/size-guide' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Our Policies', href: '/footer/our-policies' },
    ],
  },
  {
    title: 'Useful Links',
    links: [
      { label: 'Build Your Custom Jewellery', href: '/footer/custom-jewellery' },
      { label: 'Careers', href: '' },
    ],
  },
  {
    title: 'Customer Service',
    isCustomerService: true,
  },
]

const SOCIAL_LINKS: Array<SocialLink> = [
  {
    icon: FaFacebookF,
    href: 'https://facebook.com/nazumeahjewellers',
    label: 'Facebook'
  },
  {
    icon: FaXTwitter,
    href: 'https://twitter.com/nazumeahjewellers',
    label: 'Twitter'
  },
  {
    icon: FaPinterestP,
    href: 'https://pinterest.com/nazumeahjewellers',
    label: 'Pinterest'
  },
  {
    icon: FaInstagram,
    href: 'https://instagram.com/nazumeahjewellers',
    label: 'Instagram'
  }
]

export default function Footer() {
  const [openSection, setOpenSection] = useState<number | null>(null)

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index)
  }

  return (
    <footer className="bg-footer">
      {/* TOP FOOTER */}
      <div className="max-w-7xl mx-auto px-2 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-1">
          {FOOTER_SECTIONS.map((section, idx) => {
            const isOpen = openSection === idx

            return (
              <div key={idx}>
                {/* HEADER */}
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full flex items-center border-b border-gray-300 cursor-pointer justify-between text-left lg:pointer-events-none hover:underline hover:translate-y-0.5"
                >
                  <h3 className="font-semibold text-sm pb-3 lg:pb-3">
                    {section.title}
                  </h3>

                  {/* + / - ONLY BELOW LG */}
                  <span className="lg:hidden text-header mb-4">
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {/* CONTENT */}
                <div
                  className={`
                    overflow-hidden transition-normal duration-300
                    ${isOpen ? 'max-h-[600px]' : 'max-h-0'}
                    lg:max-h-none
                  `}
                >
                  {/* LINKS */}
                  {section.links && (
                    <ul className="space-y-2 text-sm text-header pt-3">
                      {section.links.map((link, i) => (
                        <li key={i}>
                          <a href={link.href} className="hover:underline">
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CUSTOMER SERVICE */}
                  {section.isCustomerService && (
                    <div className="space-y-2 text-sm text-header pt-3">
                      <div className="flex gap-1">
                        <Phone className="w-3 h-4 mt-0.5" />
                        <span>
                          +123456789{' '}
                          <span className="text-gray-600">
                            (10.00am–7.00pm)
                          </span>
                        </span>
                      </div>

                      <div className="flex gap-2 text-green-600">
                        <FaWhatsapp className="w-4 h-4 mt-0.5" />
                        <span>
                          9167780916{' '}
                          <span className="text-gray-600">
                            (9.00am – 6.00pm)
                          </span>
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <Mail className="w-4 h-4 mt-0.5" />
                        <span>nazumeahjewellers.com</span>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed pt-2">
                        Nazu Meah Jewellers
                        <br />
                        Plot No 44, 45, Street Number 14,
                        <br />
                        Marol MIDC Industry Estate,
                        <br />
                        Andheri East, Mumbai – 400093
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SOCIALS & PAYMENT METHODS */}
      <div className="bg-white py-4 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* SOCIAL ICONS */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 mr-2">Follow Us:</span>
              {SOCIAL_LINKS.map((social, i) => {
                const Icon = social.icon
                return (
                  <a
                    key={i}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      w-8 h-8 flex items-center justify-center
                      border border-footer text-header
                      rounded
                      transition-transform duration-200 ease-in-out
                      hover:bg-header hover:text-white hover:border-header
                      hover:scale-102
                    "
                  >
                    <Icon size={20} />
                  </a>
                )
              })}
            </div>

            {/* PAYMENT METHODS */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 mr-2">We Accept:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {/* bKash */}
                <img 
                  src="/BkashLogo.svg" 
                  alt="bKash" 
                  className="h-8 w-auto object-contain"
                />
                
                {/* Nagad */}
                <img 
                  src="/NagadLogo.svg" 
                  alt="Nagad" 
                  className="h-8 w-auto object-contain"
                />
                
                {/* Visa */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" 
                  alt="Visa" 
                  className="h-6 w-auto object-contain"
                />
                
                {/* Mastercard */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                  alt="Mastercard" 
                  className="h-8 w-auto object-contain"
                />
                
                {/* American Express */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" 
                  alt="American Express" 
                  className="h-6 w-auto object-contain"
                />
                
               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="py-8 text-center text-xs text-gray-900 border-t border-gray-300">
        © 2025 <span className='text-header'>Nazu Meah Jewellers.</span> All Rights Reserved.
      </div>

      {/* FLOATING WHATSAPP */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-1 right-0.5 w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <FaWhatsapp className="w-6 h-6 text-white" />
      </a>
    </footer>
  )
}