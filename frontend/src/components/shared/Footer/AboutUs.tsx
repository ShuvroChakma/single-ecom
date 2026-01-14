import React from "react";

interface Owner {
  name: string;
  role: string;
  image: string; // image URL or local path
}

const owner: Owner = {
  name: "Md Shawkot Iqbal",
  role: "Founder & Managing Director",
  image: "/Owner-Image.jpeg",
};

const AboutUs: React.FC = () => {
  return (
    <section className="bg-white text-gray-800">
      {/* Hero Section */}
      <div className="bg-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-header">
          Nazu Meah Jewellers
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-700">
          Crafting trust, purity, and elegance in fine jewellery for generations.
        </p>
      </div>

      {/* Store Info */}
      <div className="max-w-6xl mx-auto px-2 py-6 ">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl font-semibold mb-5">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nazu Meah Jewellers was founded with a strong commitment to purity,
              transparency, and timeless design. What began as a passion for
              authentic jewellery has grown into a trusted name for customers
              seeking elegance and reliability.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Each piece is carefully crafted using ethically sourced gold and
              gemstones, combining traditional artistry with modern refinement.
            </p>
          </div>

          <div className="rounded-md overflow-hidden shadow-lg">
            <img
              src="/Store-Image.png"
              alt="Nazu Meah Jewellers Store"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Founder Section */}
      <div className="bg-footer py-20">
        <div className="max-w-6xl mx-auto px-2">
          <h2 className="text-3xl font-semibold text-center mb-8">
            Faces of Nazu Meah Jewellers
          </h2>
          

          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-md px-2 py-6 text-center max-w-sm">
              <div className="w-44 h-44 mx-auto rounded-full overflow-hidden mb-5">
                <img
                  src={owner.image}
                  alt={owner.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold">{owner.name}</h3>
              <p className="text-header mt-2 font-medium">{owner.role}</p>
              <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                With years of experience in the jewellery industry, Md. Shawkot Iqbal
                leads the brand with integrity, craftsmanship, and a vision to
                deliver lasting value to every customer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Why Choose Us
        </h2>
        <div className="grid md:grid-cols-3 gap-10 text-center">
          <div className="p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Guaranteed Purity</h3>
            <p className="text-gray-600">
              We ensure certified gold quality and complete transparency in
              every purchase.
            </p>
          </div>
          <div className="p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Expert Craftsmanship</h3>
            <p className="text-gray-600">
              Skilled artisans craft each piece with precision and care.
            </p>
          </div>
          <div className="p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Customer Trust</h3>
            <p className="text-gray-600">
              Long‑term relationships built on honesty, service, and quality.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
