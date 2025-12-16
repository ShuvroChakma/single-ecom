import {  Mail, Phone } from "lucide-react"

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: Array<FooterLink>
}

const FOOTER_SECTIONS: Array<FooterSection> = [
  {
    title: "Get To Know Us",
    links: [
      { label: "About Us", href: "#" },
      { label: "Brides Of India", href: "#" },
      { label: "Our Stores", href: "#" },
      { label: "CSR", href: "#" },
      { label: "Corporate Information", href: "#" },
      { label: "Blog", href: "#" },
    ]
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "FAQ", href: "#" },
      { label: "Track My Order", href: "#" },
      { label: "Ring Size Guide", href: "#" },
      { label: "Bangle Size Guide", href: "#" },
      { label: "Site Map", href: "#" },
    ]
  },
  {
    title: "Policies",
    links: [
      { label: "Refund Policy", href: "#" },
      { label: "Buyback Policy", href: "#" },
      { label: "Exchange Policy", href: "#" },
      { label: "Shipping Policy", href: "#" },
      { label: "Cancellation Policy", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Make To Order", href: "#" },
      { label: "Terms of Service", href: "#" },
    ]
  },
  {
    title: "Useful Links",
    links: [
      { label: "Build Your Custom Jewellery", href: "#" },
      { label: "Scheme Payment (India only)", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Verify Certificate", href: "#" },
    ]
  },
]

export default function Footer() {
  return (
    <footer className="w-full bg-stone-200 text-header">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Footer Sections */}
          {FOOTER_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-gray-800 mb-4 text-base">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-header transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Customer Service Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 text-base">
              Customer Service
            </h3>
            <div className="space-y-3 text-sm">
              {/* Phone Numbers */}
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-header mt-0.5 shrink-0" />
                <div>
                  <a href="tel:+912262300916" className="text-header hover:underline">
                    +91 22 62300916
                  </a>
                  <span className="text-gray-500"> (10:00am - 7:00pm)</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <a href="tel:+919167780916" className="text-green-600 hover:underline">
                    9167780916
                  </a>
                  <span className="text-gray-500"> (9:00am - 6:00pm)</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-header mt-0.5 shrink-0" />
                <a
                  href="mailto:care.in@malabargoldanddiamonds.com"
                  className="text-header hover:underline break-all"
                >
                  care.in@malabargoldanddiamonds.com
                </a>
              </div>

              {/* Address */}
              <div className="text-gray-600 text-xs leading-relaxed mt-4">
                <p className="font-medium text-gray-700">Malabar Gold and Diamonds Limited</p>
                <p className="italic">(formerly known as Malabar Gold Limited)</p>
                <p className="mt-1">Plot No.44, 45, Sheet Number 14,</p>
                <p>Marol MIDC Industry Estate,</p>
                <p>Andheri East, Mumbai - 400093</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media & Payment */}
      <div className="border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div className="bg-white px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-blue-700">VISA</div>
              <div className="bg-white px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-orange-600">MasterCard</div>
              <div className="bg-white px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-blue-600">American Express</div>
              <div className="bg-white px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-blue-800">Net Banking</div>
              <div className="bg-white px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-green-700">
                <svg className="w-12 h-4" viewBox="0 0 48 16" fill="currentColor">
                  <text x="0" y="12" fontSize="10" fontWeight="bold">SECURE</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-300 bg-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-xs text-gray-600">
            © 2025 Malabar Gold And Diamonds Limited. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/919167780916"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Contact us on WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </footer>
  )
}