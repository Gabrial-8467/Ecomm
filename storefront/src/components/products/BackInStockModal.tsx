import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertCircle, Loader2, Sparkles, Smartphone, Mail } from 'lucide-react';
import { api } from '../../services/api/client.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from 'sonner';

interface BackInStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    image?: string;
  };
  variant?: {
    id: string;
    name: string;
    sku?: string;
    price: number | string;
  } | null;
}

export const BackInStockModal: React.FC<BackInStockModalProps> = ({
  isOpen,
  onClose,
  product,
  variant,
}) => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail(user?.email || '');
      setPhone(user?.phone || '');
      setIsSuccess(false);
      setStatusMessage('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/products/${product.id}/back-in-stock`, {
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        variantId: variant?.id || undefined,
      });

      const data = response.data;
      setIsSuccess(true);
      setStatusMessage(
        data.message ||
          "You're on the priority waitlist! We'll send you an immediate alert when fresh stock arrives."
      );
      toast.success(data.message || 'Subscribed for restock notification!');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to register for restock alert. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayPrice = variant?.price ?? product.price;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          /* Success Confirmation State */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100/70 text-emerald-800 tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Priority Reserved
              </span>
              <h3 className="text-lg font-bold text-neutral-950 tracking-tight">
                You're On The Waitlist
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed px-2">
                {statusMessage}
              </p>
            </div>

            {/* Product summary snippet */}
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 text-left">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover border border-neutral-200/80 bg-white shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-500 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-neutral-900 truncate">
                  {product.name}
                </h4>
                {variant && variant.name !== 'Default' && (
                  <p className="text-2xs text-neutral-500 truncate">{variant.name}</p>
                )}
                <p className="text-xs font-bold text-neutral-950 mt-0.5">
                  ₹{Number(displayPrice).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full text-xs uppercase tracking-widest font-semibold transition-all shadow-xs"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          /* Subscription Form */
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-amber-700">
                  Restock Alert
                </span>
                <h3 className="text-base font-bold text-neutral-950 tracking-tight">
                  Notify Me When Available
                </h3>
              </div>
            </div>

            {/* Product Card Snippet */}
            <div className="flex items-center gap-3.5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover border border-neutral-200/80 bg-white shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-500 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Currently Out of Stock
                </div>
                <h4 className="text-xs font-semibold text-neutral-900 truncate">
                  {product.name}
                </h4>
                {variant && variant.name !== 'Default' && (
                  <p className="text-2xs text-neutral-500 truncate">{variant.name}</p>
                )}
                <p className="text-xs font-bold text-neutral-950 mt-0.5">
                  ₹{Number(displayPrice).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              We'll notify you as soon as this handcrafted item is replenished at our warehouse. No spam, ever.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-neutral-500" />
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-neutral-500" />
                  Mobile Number <span className="text-neutral-400 font-normal">(Optional for SMS/WhatsApp alert)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-full text-xs uppercase tracking-widest font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining Waitlist...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me When In Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
