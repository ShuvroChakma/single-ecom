import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getOrderByNumber, type Order } from "@/api/orders";
import { Loader2, Package, Truck, CheckCircle, Clock } from "lucide-react";

const TrackOrderPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);

  const trackOrderMutation = useMutation({
    mutationFn: getOrderByNumber,
    onSuccess: (response) => {
      if (response.data) {
        setOrder(response.data);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      alert("Please enter your Order Number");
      return;
    }

    trackOrderMutation.mutate(orderNumber.trim());
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <section className="w-full flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Search Form */}
        <div className="bg-white border rounded-md shadow-sm mb-6">
          <div className="bg-header text-white text-center py-4 rounded-t-md">
            <h1 className="text-lg font-medium">Track My Order</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter your order number (e.g., ORD-20250210-XXXXX)"
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-rose-700"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={trackOrderMutation.isPending}
                className="bg-header hover:bg-header/90 text-white px-8 py-2 rounded-sm text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {trackOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Track Order'
                )}
              </button>
            </div>

            {trackOrderMutation.isError && (
              <p className="text-center text-sm text-red-600 mt-4">
                Order not found. Please check your order number and try again.
              </p>
            )}

            <p className="text-center text-sm text-rose-700 mt-6">
              Please enter your Order Number to track your order status
            </p>
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-white border rounded-md shadow-sm">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">Order #{order.order_number}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 border-b">
              <h3 className="font-medium mb-4">Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-contain rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">{item.variant_info}</p>
                      <p className="text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">৳ {item.subtotal.toLocaleString('en-BD')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-6 border-b">
              <h3 className="font-medium mb-2">Shipping Address</h3>
              <div className="text-sm text-gray-600">
                <p>{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
                <p>{order.shipping_address.phone}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6">
              <h3 className="font-medium mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>৳ {order.subtotal.toLocaleString('en-BD')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-৳ {order.discount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>৳ {order.shipping_cost.toLocaleString('en-BD')}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>৳ {order.total.toLocaleString('en-BD')}</span>
                </div>
              </div>
            </div>

            {/* Tracking Number */}
            {order.tracking_number && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-header" />
                  <span className="font-medium">Tracking Number:</span>
                  <span className="text-header">{order.tracking_number}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrackOrderPage;
