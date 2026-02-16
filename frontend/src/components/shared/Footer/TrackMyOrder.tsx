import React, { useState, useContext } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Package, ArrowRight, LogIn } from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";

const TrackOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const isLoggedIn = authContext?.isAuthenticated;

  return (
    <section className="w-full flex items-center justify-center bg-gray-50 px-4 py-8 min-h-[60vh]">
      <div className="w-full max-w-lg">
        <div className="bg-white border rounded-md shadow-sm">
          <div className="bg-header text-white text-center py-4 rounded-t-md">
            <h1 className="text-lg font-medium">Track My Order</h1>
          </div>

          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-header mx-auto mb-4" />

            {isLoggedIn ? (
              <>
                <h2 className="text-xl font-semibold mb-2">View Your Orders</h2>
                <p className="text-gray-600 mb-6">
                  Access your order history to track shipments and view order details.
                </p>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 bg-header hover:bg-header/90 text-white px-6 py-3 rounded-md transition"
                >
                  Go to My Orders
                  <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">Login to Track Orders</h2>
                <p className="text-gray-600 mb-6">
                  Please log in to your account to view and track your orders.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 bg-header hover:bg-header/90 text-white px-6 py-3 rounded-md transition"
                >
                  <LogIn size={18} />
                  Login to Continue
                </Link>

                <p className="text-sm text-gray-500 mt-6">
                  Don't have an account?{' '}
                  <Link to="/profile" className="text-header hover:underline">
                    Register here
                  </Link>
                </p>
              </>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50 text-center text-sm text-gray-600">
            <p>Need help? Contact us at support@example.com</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackOrderPage;
