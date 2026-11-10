import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import { DeliveryZone } from '../../types/index.js';
import { Truck, Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export const DeliveryZonesPage: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('Mohali');
  const [state, setState] = useState('Punjab');
  const [pincodesInput, setPincodesInput] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(150);
  const [minimumOrder, setMinimumOrder] = useState(500);
  const [estimatedDays, setEstimatedDays] = useState(2);

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    setIsLoading(true);
    try {
      const response = await api.get('/delivery/zones?includeInactive=true');
      setZones(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load delivery zones:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const pincodes = pincodesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    if (pincodes.length === 0) {
      toast.error('Please enter at least one valid 6-digit PIN code');
      return;
    }

    try {
      await api.post('/delivery/zones', {
        name,
        city,
        state,
        pincodes,
        deliveryCharge: Number(deliveryCharge),
        minimumOrder: Number(minimumOrder),
        estimatedDays: Number(estimatedDays),
        isActive: true,
      });

      toast.success('Local delivery zone configured successfully');
      setIsAdding(false);
      setName('');
      setPincodesInput('');
      fetchZones();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create delivery zone');
    }
  };

  const handleDelete = async (id: string, zoneName: string) => {
    if (!confirm(`Delete delivery zone ${zoneName}?`)) return;
    try {
      await api.delete(`/delivery/zones/${id}`);
      toast.success('Delivery zone removed');
      fetchZones();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete zone');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Local Delivery Zones</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure serviceable PIN codes, minimum order thresholds, and delivery charges
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Zone</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            New Local Delivery Area
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Zone Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mohali Phase 1-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Comma-Separated PIN Codes
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 160055, 160059, 160062, 160070"
              value={pincodesInput}
              onChange={(e) => setPincodesInput(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Delivery Charge (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Minimum Cart Value (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Estimated Delivery (Days)
              </label>
              <input
                type="number"
                required
                min={1}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
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
              Save Zone
            </button>
          </div>
        </form>
      )}

      {/* Zones Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {zones.map((zone) => (
          <div key={zone.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  {zone.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {zone.city}, {zone.state} • Estimated: {zone.estimatedDays} days
                </p>
              </div>
              <button
                onClick={() => handleDelete(zone.id, zone.name)}
                className="p-1.5 text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {zone.pincodes.map((pin) => (
                <span
                  key={pin}
                  className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-mono rounded-md"
                >
                  {pin}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-300">
              <span>Delivery Fee: ₹{Number(zone.deliveryCharge)}</span>
              <span>Min Order: ₹{Number(zone.minimumOrder)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
