import React from "react";

const OurPolicies: React.FC = () => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16 text-gray-800 space-y-12">
      <h1 className="text-3xl font-semibold text-center">Our Policies</h1>

      {/* Refund Policy */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">Refund Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We want you to be fully satisfied with your purchase. If you are not
          completely happy with your jewellery, you may request a refund under
          the following conditions:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            Refund requests must be made within <strong>3–7 days</strong> of
            delivery, depending on the product type.
          </li>
          <li>
            Products must be unused and in original condition with all tags and
            packaging intact.
          </li>
          <li>
            Shipping charges may be deducted from the refund amount unless the
            return is due to our error.
          </li>
          <li>
            Refunds are processed within <strong>7–15 working days</strong> after quality inspection.
          </li>
        </ul>
      </div>

      {/* Exchange Policy */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">Exchange Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We offer exchanges to ensure complete customer satisfaction.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            Exchanges are accepted within <strong>7 days</strong> of delivery
            for size or design changes.
          </li>
          <li>
            Items must be unused, unworn, and returned in original packaging.
          </li>
          <li>
            Customized or engraved jewellery is not eligible for exchange.
          </li>
        </ul>
      </div>

      {/* Shipping Policy */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">Shipping Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We ensure safe and timely delivery across Bangladesh.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            Standard delivery takes <strong>3–7 business days</strong>.
          </li>
          <li>
            Shipping charges, if applicable, are shown during checkout.
          </li>
          <li>
            Delivery delays may occur due to weather, holidays, or courier
            issues.
          </li>
        </ul>
      </div>

      {/* Cancellation Policy */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">Cancellation Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          Orders can be cancelled before shipment.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Full refund if cancelled before dispatch.</li>
          <li>
            If shipped, cancellation will follow return and refund policy.
          </li>
          <li>Custom-made orders cannot be cancelled.</li>
        </ul>
      </div>

      {/* Privacy Policy */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">Privacy Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We respect your privacy and protect your personal information.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>We collect only necessary customer information.</li>
          <li>Data is used strictly for order processing and support.</li>
          <li>Your information is never shared with third parties.</li>
        </ul>
      </div>

      {/* Make to Order */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">
          Make-to-Order / Custom Jewellery
        </h2>
        <p className="text-gray-600 leading-relaxed">
          We create customized jewellery based on your preferences.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Custom orders require advance payment.</li>
          <li>Production starts after confirmation.</li>
          <li>Custom items are non-refundable and non-cancellable.</li>
        </ul>
      </div>

      {/* Terms of Service */}
      <div>
        <h2 className="text-2xl font-semibold mb-3">Terms of Service</h2>
        <p className="text-gray-600 leading-relaxed">
          By using our services, you agree to the following terms:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Prices may change due to gold market fluctuations.</li>
          <li>Order acceptance is subject to verification.</li>
          <li>All disputes are governed by Bangladeshi law.</li>
        </ul>
      </div>
    </section>
  );
};

export default OurPolicies;
