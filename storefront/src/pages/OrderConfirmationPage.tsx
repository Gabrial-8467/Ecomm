import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Truck, FileText, ArrowRight } from 'lucide-react';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Thank You for Your Order!</h1>
        <p className="text-sm text-slate-600">
          Your order has been recorded in our single-store inventory system.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-500">Order Reference</span>
          <span className="text-sm font-black text-primary-600">{orderNumber}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Fulfillment Status</span>
            <span className="font-bold text-slate-800">Confirmed & Processing</span>
          </div>
          <div>
            <span className="text-slate-400 block">Dispatch Channel</span>
            <span className="font-bold text-slate-800">Direct Store Delivery</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-primary-600" />
            <span>Store Dispatch Information</span>
          </div>
          <p>
            Our delivery staff will contact you before departure. For furniture items, free assembly is included at the time of delivery.
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Link
          to="/"
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
