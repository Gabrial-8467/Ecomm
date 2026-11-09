import React, { useState } from 'react';
import { Sofa, CheckCircle2, MessageCircle } from 'lucide-react';

export default function QuotationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('FURNITURE');
  const [requirements, setRequirements] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Direct Shop Consultation
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-2">
          Request Custom Quotation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Custom solid wood furniture dimensions, commercial office fitouts, or bulk electronics packages.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Quotation Request Received</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Our store owner Rajesh Sharma will review your requirements and reach out on {phone} within 24 hours with itemized pricing.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter contact name"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category / Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white font-medium"
              >
                <option value="FURNITURE">Custom Furniture (Beds, Sofas, Wardrobes, Dining)</option>
                <option value="ELECTRONICS">Commercial Electronics & Bulk Home Appliances</option>
                <option value="MOBILES_ACCESSORIES">Bulk Mobile Accessories / Institutional</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Requirements & Dimensions *</label>
              <textarea
                required
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe wood preferences (Sheesham, Teak), room dimensions, quantity required..."
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition shadow-sm"
            >
              Submit Quotation Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
