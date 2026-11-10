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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons & Promotions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create percentage or flat discount promo codes for showroom marketing
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Coupon</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            New Promo Code
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Coupon Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FESTIVAL15"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Flat Discount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Discount Value
              </label>
              <input
                type="number"
                required
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description (Customer Facing)
            </label>
            <input
              type="text"
              placeholder="e.g. 15% off on your living room furniture order"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Min Cart Value (₹)
              </label>
              <input
                type="number"
                min={0}
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Max Cap Discount (₹)
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={maximumDiscount || ''}
                onChange={(e) => setMaximumDiscount(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Save Coupon
            </button>
          </div>
        </form>
      )}

      {/* Coupons Subheader */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-800">Active Promotional Coupons</h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
          </span>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <TicketPercent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No active coupons</p>
            <p className="text-xs text-slate-400 mt-1">Create a promotional code to attract showroom customers.</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-amber-300 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                      <TicketPercent className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-base tracking-wide group-hover:text-amber-800 transition-colors">
                        {coupon.code}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {coupon.description || 'Promotional coupon code'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-2xs"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${Number(coupon.discountValue)}% OFF`
                      : `₹${Number(coupon.discountValue)} OFF`}
                    {coupon.maximumDiscount && ` (up to ₹${Number(coupon.maximumDiscount)})`}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    Min ₹{Number(coupon.minimumOrder).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500 bg-slate-50/60 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                <span>Usage Redemptions:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {coupon.usedCount} / {coupon.usageLimit ? coupon.usageLimit : '∞ Unlimited'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
