import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import { Coupon } from '../../types/index.js';
import { TicketPercent, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [minimumOrder, setMinimumOrder] = useState(1000);
  const [maximumDiscount, setMaximumDiscount] = useState<number | undefined>(1500);
  const [usageLimit, setUsageLimit] = useState(100);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setIsLoading(true);
    try {
      const response = await api.get('/coupons');
      setCoupons(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minimumOrder: Number(minimumOrder),
        maximumDiscount: maximumDiscount ? Number(maximumDiscount) : undefined,
        usageLimit: Number(usageLimit),
        isActive: true,
      });

      toast.success('Coupon created successfully');
      setIsAdding(false);
      setCode('');
      setDescription('');
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Delete coupon ${couponCode}?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon removed');
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Coupons & Promotions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create percentage or flat discount promo codes for showroom marketing
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Coupon</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            New Promo Code
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Coupon Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FESTIVAL15"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Flat Discount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Discount Value
              </label>
              <input
                type="number"
                required
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Description (Customer Facing)
            </label>
            <input
              type="text"
              placeholder="e.g. 15% off on your living room furniture order"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Min Cart Value (₹)
              </label>
              <input
                type="number"
                min={0}
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Max Cap Discount (₹)
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={maximumDiscount || ''}
                onChange={(e) => setMaximumDiscount(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
            >
              Save Coupon
            </button>
          </div>
        </form>
      )}

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-amber-400 text-lg flex items-center gap-2">
                  <TicketPercent className="w-5 h-5 text-amber-500" />
                  {coupon.code}
                </span>
                <p className="text-xs text-slate-300 mt-1">{coupon.description || 'General discount'}</p>
              </div>
              <button
                onClick={() => handleDelete(coupon.id, coupon.code)}
                className="p-1.5 text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>
                Discount:{' '}
                <strong className="text-white">
                  {coupon.discountType === 'PERCENTAGE'
                    ? `${Number(coupon.discountValue)}% off`
                    : `₹${Number(coupon.discountValue)} flat`}
                </strong>
                {coupon.maximumDiscount && ` (Capped at ₹${Number(coupon.maximumDiscount)})`}
              </p>
              <p>Minimum Order: ₹{Number(coupon.minimumOrder)}</p>
              <p>
                Redemptions: {coupon.usedCount} / {coupon.usageLimit || 'Unlimited'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
