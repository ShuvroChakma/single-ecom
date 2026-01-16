import React, { useState } from "react";

interface FAQ {
  question: string;
  answer: string;
}

const faqData: Record<string, Array<FAQ>> = {
  "General Merchandise Queries": [
    {
      question:
        "What if I do not find the piece that I wanted on the site anymore? Can I still place an order?",
      answer:
        "Yes. Please contact our customer support team. We will check availability or assist you with a custom order if possible.",
    },
    {
      question:
        "Is there an option of getting jewellery with different metal or gemstone that is not offered on the website?",
      answer:
        "Customization is available on selected designs. Kindly reach out to our support team for further assistance.",
    },
    {
      question: "Are pendants available with the chain?",
      answer:
        "Some pendants include a chain, while others are sold separately. Please check the product description for details.",
    },
    {
      question: "Do you deal with conflict-free diamonds?",
      answer:
        "Yes. All our diamonds are ethically sourced and certified conflict-free.",
    },
  ],

  "Delivery And Shipment": [
    {
      question: "How long does delivery usually take?",
      answer:
        "Orders are typically delivered within 7–10 working days, depending on your location and product availability.",
    },
    {
      question: "Do you offer international shipping?",
      answer:
        "Currently, we deliver within the country. International shipping options will be introduced soon.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order is shipped, tracking details will be shared via SMS or email.",
    },
  ],

  "Online Purchase Related": [
    {
      question: "Is it safe to purchase jewellery online from your website?",
      answer:
        "Yes. Our website uses secure encryption and trusted payment gateways to protect your data.",
    },
    {
      question: "Will I receive the same product as shown online?",
      answer:
        "Yes. All images represent the actual product. Minor variations may occur due to lighting or screen settings.",
    },
  ],

  Payments: [
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept credit/debit cards, mobile banking, and other secure online payment options.",
    },
    {
      question: "Is cash on delivery available?",
      answer:
        "Cash on delivery may be available for selected locations. Please check during checkout.",
    },
  ],

  "Product Sizing": [
    {
      question: "How do I know my ring size?",
      answer:
        "You can refer to our ring size guide available on the product page or visit our showroom for assistance.",
    },
    {
      question: "Can I resize my jewellery after purchase?",
      answer:
        "Yes. Resizing is possible for most designs, subject to design limitations.",
    },
  ],

  "My Account And Registration": [
    {
      question: "Do I need to create an account to place an order?",
      answer:
        "Yes. Creating an account helps you track orders and manage your purchases easily.",
    },
    {
      question: "I forgot my password. What should I do?",
      answer:
        "Use the 'Forgot Password' option on the login page to reset your password securely.",
    },
  ],

  "Return, Exchange & Buyback Policies": [
    {
      question: "Do you offer returns or exchanges?",
      answer:
        "Yes. Returns and exchanges are allowed as per our policy within the specified time period.",
    },
    {
      question: "Is there a buyback policy for gold jewellery?",
      answer:
        "Yes. We offer buyback options based on prevailing gold rates and product condition.",
    },
  ],

  "Security Questions And Privacy Policy": [
    {
      question: "Is my personal information secure?",
      answer:
        "Absolutely. We strictly follow data protection practices and never share customer information with third parties.",
    },
    {
      question: "Will my payment details be stored?",
      answer:
        "No. Payment details are processed securely by trusted gateways and are not stored on our servers.",
    },
  ],
};

const FAQPage: React.FC = () => {
  const categories = Object.keys(faqData);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-semibold mb-12">
        Frequently Asked Questions
      </h1>

      <div className="grid md:grid-cols-4 gap-10">
        {/* Sidebar */}
        <aside className="md:col-span-1 space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setOpenIndex(null);
              }}
              className={`w-full text-left px-4 py-3 text-sm border transition rounded-sm
                ${
                  activeCategory === category
                    ? "bg-gray-100 font-medium"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
            >
              {category}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold text-header mb-6">
            {activeCategory}
          </h2>

          <div className="space-y-4">
            {faqData[activeCategory].map((faq, index) => (
              <div key={index} className="border-b pb-4">
                <button
                  className="flex items-start gap-2 text-left w-full"
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                >
                  <span className="text-gray-600 mt-1">›</span>
                  <span className="font-medium">{faq.question}</span>
                </button>

                {openIndex === index && (
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed ml-4">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQPage;