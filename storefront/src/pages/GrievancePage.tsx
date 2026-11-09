import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, CheckCircle2, Search, Clock, FileText } from 'lucide-react';

export default function GrievancePage() {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Tracking state
  const [trackNumber, setTrackNumber] = useState('');
  const [trackedGrievance, setTrackedGrievance] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitGrievance({
        complainantName: name,
        phoneNumber: phone,
        email,
        subject,
        description,
      });
      setSubmittedTicket(res.data.ticketNumber);
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    try {
      const res = await api.trackGrievance(trackNumber.trim());
      setTrackedGrievance(res.data);
    } catch (err: any) {
      setTrackError(err.message || 'Ticket not found');
      setTrackedGrievance(null);
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">
          <ShieldAlert className="h-4 w-4" />
          <span>Consumer Protection (E-Commerce) Rules, 2020 Compliance</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Grievance Redressal Portal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Mandatory statutory mechanism for Indian consumer complaints. Acknowledged within 48 hours and redressed within 30 days.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('submit')}
          className={`py-2.5 px-6 text-xs font-bold border-b-2 transition ${
            activeTab === 'submit'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Submit New Grievance
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`py-2.5 px-6 text-xs font-bold border-b-2 transition ${
            activeTab === 'track'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Track Existing Ticket
        </button>
      </div>

      {activeTab === 'submit' ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {submittedTicket ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Grievance Submitted & Acknowledged</h3>
              <p className="text-xs text-slate-600">
                Your statutory complaint ticket is:{' '}
                <strong className="text-slate-900 font-black">{submittedTicket}</strong>
              </p>
              <div className="text-[11px] text-slate-500 max-w-md mx-auto">
                Under the Consumer Protection Rules, this has been officially logged with our Grievance Officer and will be investigated within statutory time limits (maximum 30 days).
              </div>
              <button
                onClick={() => setSubmittedTicket(null)}
                className="mt-3 text-xs font-bold text-primary-600 hover:underline"
              >
                Submit another grievance
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Complainant Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full legal name"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone Number *</label>
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
                <label className="block text-slate-700 font-semibold mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject / Order Number *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Defective Table Leg / Delayed Delivery of Smart TV"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description of Grievance *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details, dates, and order identifiers for prompt resolution."
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition"
              >
                {submitting ? 'Submitting...' : 'Submit Grievance to Compliance Officer'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleTrack} className="flex gap-2 text-xs">
            <input
              type="text"
              placeholder="Enter Grievance Ticket Number (e.g. GRV-2026-1001)"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value.toUpperCase())}
              className="flex-1 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold uppercase"
            />
            <button
              type="submit"
              disabled={trackLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span>Track</span>
            </button>
          </form>

          {trackError && <div className="text-xs text-red-600 font-semibold">{trackError}</div>}

          {trackedGrievance && (
            <div className="border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm">{trackedGrievance.ticketNumber}</span>
                <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full uppercase text-[10px]">
                  {trackedGrievance.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Complainant:</span>
                  <span className="font-semibold text-slate-800">{trackedGrievance.complainantName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Submitted On:</span>
                  <span>{new Date(trackedGrievance.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Statutory Acknowledgment:</span>
                  <span className="text-emerald-700 font-medium">Logged within 48 hours SLA</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Resolution Target:</span>
                  <span>Within 30 calendar days</span>
                </div>
              </div>
              {trackedGrievance.resolutionNotes && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-800 mb-1">Grievance Officer Resolution:</div>
                  <p className="text-slate-600">{trackedGrievance.resolutionNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
