import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldAlert, FileText, Calendar, CheckCircle } from 'lucide-react';

const POLICY_MAP: Record<string, string> = {
  terms: 'TERMS_AND_CONDITIONS',
  privacy: 'PRIVACY_POLICY',
  refunds: 'RETURN_AND_REFUND_POLICY',
  cancellation: 'CANCELLATION_POLICY',
  shipping: 'SHIPPING_POLICY',
  warranty: 'WARRANTY_POLICY',
  cookie: 'COOKIE_POLICY',
  disclaimer: 'DISCLAIMER',
  grievance: 'GRIEVANCE_POLICY',
};

export default function LegalPolicyPage() {
  const { policyType } = useParams<{ policyType: string }>();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const mappedType = POLICY_MAP[policyType || 'terms'] || 'TERMS_AND_CONDITIONS';

  useEffect(() => {
    async function loadDoc() {
      setLoading(true);
      try {
        const res = await api.getLegalDoc(mappedType);
        setDoc(res.data);
      } catch (err) {
        console.error('Failed to load legal document:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [mappedType]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading statutory policy document...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">
            <FileText className="h-4 w-4" />
            <span>Statutory Legal Document • Apex Retail Enterprises LLP</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">{doc?.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Effective Date: {new Date(doc?.effectiveDate || Date.now()).toLocaleDateString('en-IN')}
            </span>
            <span>•</span>
            <span>Version: {doc?.version || '1.0'}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Verified for Consumer Protection & DPDP Act Compliance
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700">
          {doc?.content}
        </div>

        {/* Legal Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl space-y-2">
          <div className="font-bold text-slate-800">Legal Contact & Redressal Information:</div>
          <p>
            Operating under the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> and{' '}
            <strong>Digital Personal Data Protection Act, 2023</strong>. For formal grievances, please reach our
            designated Grievance Officer at <a href="mailto:grievance@apexretailers.in" className="text-primary-600 underline">grievance@apexretailers.in</a> or visit our{' '}
            <Link to="/legal/grievance-form" className="text-primary-600 underline font-semibold">
              Grievance Redressal Portal
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
