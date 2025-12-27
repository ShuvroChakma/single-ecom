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

const FOOTER_SECTIONS: Array<FooterSection> = [
  {
    title: 'Get To Know Us',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Brides Of India', href: '#' },
      { label: 'Our Stores', href: '#' },
      { label: 'CSR', href: '#' },
      { label: 'Corporate Information', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Let Us Help You',
    links: [
      { label: 'FAQ', href: '#' },
      { label: 'Track My Order', href: '#' },
      { label: 'Ring Size Guide', href: '#' },
      { label: 'Bangle Size Guide', href: '#' },
      { label: 'Site Map', href: '#' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Refund Policy', href: '#' },
      { label: 'Buyback Policy', href: '#' },
      { label: 'Exchange Policy', href: '#' },
      { label: 'Shipping Policy', href: '#' },
      { label: 'Cancellation Policy', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Make To Order', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
  {
    title: 'Useful Links',
    links: [
      { label: 'Build Your Custom Jewellery', href: '#' },
      { label: 'Scheme Payment (India only)', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Verify Certificate', href: '#' },
    ],
  },
  {
    title: 'Customer Service',
    isCustomerService: true,
  },
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
                      <div className="flex gap-0">
                        <Phone className="w-3 h-4 mt-0.5" />
                        <span>
                          +912262300916{' '}
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

                      <div className="flex gap-0">
                        <Mail className="w-4 h-4 mt-0.5" />
                        <span>care.in@malabargoldanddiamonds.com</span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed pt-2">
                        Malabar Gold and Diamonds Limited
                        <br />
                        (formerly known as Malabar Gold Limited)
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

      {/* SOCIALS */}
      <div className="bg-white py-4 border-t border-gray-300">
        <div className="flex justify-center gap-3">
          {[FaFacebookF, FaXTwitter, FaPinterestP, FaInstagram].map(
            (Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="
            w-8 h-8 flex items-center justify-center
            border border-footer text-header
            rounded
            transition-transform duration-200 ease-in-out
            hover:bg-header hover:text-white hover:border-header
            hover:scale-102
          "
              >
                <Icon size={14} />
              </a>
            ),
          )}
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="py-8 text-center text-xs text-gray-600 border-t border-gray-300">
        © 2025 Nazu Meah Jewellers. All Rights Reserved.
      </div>

      {/* FLOATING WHATSAPP */}
      <a
        href="https://wa.me/919167780916"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-2 right-2 w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <FaWhatsapp className="w-6 h-6 text-white" />
      </a>
    </footer>
  )
}
