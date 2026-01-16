import React from "react";

// Size Guide Page for Rings & Bangles
// Jewellery E-commerce Website
// React + TypeScript (TSX)

const SizeGuidePage: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl text-header font-semibold mb-10">Jewellery Size Guide</h1>

      {/* Ring Size Guide */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4">Ring Size Guide</h2>
        <p className="text-gray-600 mb-6 max-w-3xl">
          Use the table below to find your perfect ring size. For best results,
          measure the inside diameter of a ring that fits you comfortably.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-header text-white">
              <tr>
                <th className="border px-4 py-3 text-left">Ring Size (BD)</th>
                <th className="border px-4 py-3 text-left">Ring Size (UK)</th>
                <th className="border px-4 py-3 text-left">Inside Diameter (mm)</th>
                <th className="border px-4 py-3 text-left">Finger Circumference (mm)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-3">6</td>
                <td className="border px-4 py-3">L</td>
                <td className="border px-4 py-3">16.5</td>
                <td className="border px-4 py-3">52</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-4 py-3">7</td>
                <td className="border px-4 py-3">N</td>
                <td className="border px-4 py-3">17.3</td>
                <td className="border px-4 py-3">54.5</td>
              </tr>
              <tr>
                <td className="border px-4 py-3">8</td>
                <td className="border px-4 py-3">P</td>
                <td className="border px-4 py-3">18.1</td>
                <td className="border px-4 py-3">57</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-4 py-3">9</td>
                <td className="border px-4 py-3">R</td>
                <td className="border px-4 py-3">18.9</td>
                <td className="border px-4 py-3">59.5</td>
              </tr>
              <tr>
                <td className="border px-4 py-3">10</td>
                <td className="border px-4 py-3">T</td>
                <td className="border px-4 py-3">19.8</td>
                <td className="border px-4 py-3">62</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bangle Size Guide */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Bangle Size Guide</h2>
        <p className="text-gray-600 mb-6 max-w-3xl">
          To determine your bangle size, measure the widest part of your hand
          (across the knuckles) and compare it with the table below.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-header text-white">
              <tr>
                <th className="border px-4 py-3 text-left">Bangle Size</th>
                <th className="border px-4 py-3 text-left">Inside Diameter (inches)</th>
                <th className="border px-4 py-3 text-left">Inside Diameter (mm)</th>
                <th className="border px-4 py-3 text-left">Hand Circumference (mm)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-3">2.4</td>
                <td className="border px-4 py-3">2.25</td>
                <td className="border px-4 py-3">57.2</td>
                <td className="border px-4 py-3">180</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-4 py-3">2.6</td>
                <td className="border px-4 py-3">2.38</td>
                <td className="border px-4 py-3">60.3</td>
                <td className="border px-4 py-3">190</td>
              </tr>
              <tr>
                <td className="border px-4 py-3">2.8</td>
                <td className="border px-4 py-3">2.50</td>
                <td className="border px-4 py-3">63.5</td>
                <td className="border px-4 py-3">200</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-4 py-3">2.10</td>
                <td className="border px-4 py-3">2.63</td>
                <td className="border px-4 py-3">66.7</td>
                <td className="border px-4 py-3">210</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-14 bg-gray-50 border rounded-md p-6 max-w-4xl">
        <h3 className="text-lg font-semibold mb-3">Helpful Tips</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
          <li>Measure your finger or hand at the end of the day for accuracy.</li>
          <li>Avoid measuring when your hands are cold.</li>
          <li>If you are between sizes, choose the larger size.</li>
          <li>For assistance, feel free to visit our showroom or contact support.</li>
        </ul>
      </div>
    </section>
  );
};

export default SizeGuidePage;
