import React, { useState } from "react";

// Track My Order Page
// Jewellery E‑commerce Website
// React + TypeScript (TSX)

const TrackOrderPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      alert("Please enter your Order Number");
      return;
    }

    // TODO: Integrate API call for order tracking
    console.log("Tracking order:", orderNumber);
  };

  return (
    <section className="w-full flex items-center justify-center bg-gray-50 px-4 py-4">
      <div className="w-full max-w-lg bg-white border rounded-md shadow-sm">
        {/* Header */}
        <div className="bg-header text-white text-center py-4 rounded-t-md">
          <h1 className="text-lg font-medium">Track My Order</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Number
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter your order number"
              className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-rose-700"
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="bg-header hover:bg-header/90 text-white px-8 py-2 rounded-sm text-sm transition"
            >
              Submit
            </button>
          </div>

          <p className="text-center text-sm text-rose-700 mt-6">
            Please enter your Order Number to track your order status
          </p>
        </form>
      </div>
    </section>
  );
};

export default TrackOrderPage;
