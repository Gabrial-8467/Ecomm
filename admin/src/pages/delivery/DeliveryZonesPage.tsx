import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import { DeliveryZone } from '../../types/index.js';
import { Plus, Trash2, MapPin } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Local Delivery Zones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure serviceable PIN codes, minimum order thresholds, and delivery charges
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Zone</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            New Local Delivery Area
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Zone Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mohali Phase 1-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Comma-Separated PIN Codes
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 160055, 160059, 160062, 160070"
              value={pincodesInput}
              onChange={(e) => setPincodesInput(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Delivery Charge (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Minimum Cart Value (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Estimated Delivery (Days)
              </label>
              <input
                type="number"
                required
                min={1}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
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
              Save Zone
            </button>
          </div>
        </form>
      )}

      {/* Zones Subheader */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-800">Local Delivery Territories</h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {zones.length} {zones.length === 1 ? 'zone' : 'zones'}
          </span>
        </div>
      </div>

      {/* Zones Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {zones.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No delivery zones configured</p>
            <p className="text-xs text-slate-400 mt-1">Add local PIN codes and delivery charges to enable dispatch.</p>
          </div>
        ) : (
          zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-amber-300 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                      <MapPin className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-800 transition-colors">
                        {zone.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {zone.city}, {zone.state} • Est. {zone.estimatedDays} {zone.estimatedDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(zone.id, zone.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-2xs"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Serviceable PIN Codes ({zone.pincodes.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {zone.pincodes.map((pin) => (
                      <span
                        key={pin}
                        className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 text-xs font-mono font-medium rounded-md shadow-2xs"
                      >
                        {pin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50/60 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                <span>Fee: <strong className="text-slate-900 font-bold">₹{Number(zone.deliveryCharge)}</strong></span>
                <span>Min Order: <strong className="text-slate-900 font-bold">₹{Number(zone.minimumOrder).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
