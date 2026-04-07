import { useState } from 'react'
import { Mail, Minus, Phone, Plus } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaWhatsapp,
  FaXTwitter,
} from 'react-icons/fa6'
import { Link } from '@tanstack/react-router'
import { useSettings } from '@/contexts/SettingsContext'

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
      { label: "Today's Metal Prices", href: '/footer/metal-prices' },
      { label: 'Careers', href: '' },
    ],
  },
  {
    title: 'Customer Service',
    isCustomerService: true,
  },
]

export default function Footer() {
  const [openSection, setOpenSection] = useState<number | null>(null)
  const {
    store_name,
    contact_phone,
    whatsapp_number,
    contact_email,
    contact_address,
    facebook_url,
    instagram_url,
    twitter_url,
    pinterest_url,
  } = useSettings()

  const socialLinks: Array<SocialLink> = [
    facebook_url && { icon: FaFacebookF, href: facebook_url, label: 'Facebook' },
    twitter_url && { icon: FaXTwitter, href: twitter_url, label: 'Twitter' },
    pinterest_url && { icon: FaPinterestP, href: pinterest_url, label: 'Pinterest' },
    instagram_url && { icon: FaInstagram, href: instagram_url, label: 'Instagram' },
  ].filter(Boolean) as Array<SocialLink>

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index)
  }

  return (
    <footer className="bg-footer">

      {/* ── LOGO SECTION ── */}
      <div className="border-b border-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
          {/* Replace src with your actual logo path */}
          <a href="/">
            <img
              src="/NazuMeah.svg"
              alt="Nazu Meah Jewellers"
              className="h-16 w-auto object-contain"
            />
          </a>
          <p className="text-sm text-gray-500 tracking-widest uppercase">
            Trust, Elegance &amp; Pure Gold Jewellery
          </p>
        </div>
      </div>

      {/* ── TOP FOOTER (accordion links) ── */}
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
                          {link.href ? (
                            <Link to={link.href} className="hover:underline">
                              {link.label}
                            </Link>
                          ) : (
                            <span className="text-gray-400 cursor-not-allowed">{link.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CUSTOMER SERVICE */}
                  {section.isCustomerService && (
                    <div className="space-y-2 text-sm text-header pt-3">
                      {contact_phone && (
                        <div className="flex gap-1">
                          <Phone className="w-3 h-4 mt-0.5" />
                          <span>
                            {contact_phone}{' '}
                            <span className="text-gray-600">
                              (10.00am–7.00pm)
                            </span>
                          </span>
                        </div>
                      )}

                      {whatsapp_number && (
                        <div className="flex gap-2 text-green-600">
                          <FaWhatsapp className="w-4 h-4 mt-0.5" />
                          <span>
                            {whatsapp_number}{' '}
                            <span className="text-gray-600">
                              (9.00am – 6.00pm)
                            </span>
                          </span>
                        </div>
                      )}

                      {contact_email && (
                        <div className="flex gap-1">
                          <Mail className="w-4 h-4 mt-0.5" />
                          <span>{contact_email}</span>
                        </div>
                      )}

                      {contact_address && (
                        <p className="text-sm text-gray-600 leading-relaxed pt-2 whitespace-pre-line">
                          {contact_address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SOCIALS & PAYMENT METHODS ── */}
      <div className="bg-white py-4 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* SOCIAL ICONS */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 mr-2">Follow Us:</span>
              {socialLinks.map((social, i) => {
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
                <img src="/BkashLogo.svg" alt="bKash" className="h-8 w-auto object-contain" />
                <img src="/NagadLogo.svg" alt="Nagad" className="h-8 w-auto object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6 w-auto object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8 w-auto object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="American Express" className="h-6 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── COPYRIGHT ── */}
      <div className="py-8 text-center text-xs text-gray-900 border-t border-gray-300">
        © {new Date().getFullYear()} <span className='text-header'>{store_name}.</span> All Rights Reserved.
      </div>

      {/* FLOATING WHATSAPP */}
      {whatsapp_number && (
        <a
          href={`https://wa.me/${whatsapp_number.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-1 right-0.5 w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-50"
        >
          <FaWhatsapp className="w-6 h-6 text-white" />
        </a>
      )}
    </footer>
  )
}