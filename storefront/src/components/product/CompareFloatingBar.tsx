import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../../store/compareStore.js';
import { Scale, X, ArrowRight } from 'lucide-react';

export const CompareFloatingBar: React.FC = () => {
  const { items, removeItem, clearItems } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-stone-900/95 text-white backdrop-blur-md border border-stone-700/80 rounded-2xl shadow-2xl p-3 sm:p-4 transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Info & Items thumbnail list */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto py-1">
          <div className="flex items-center gap-2 pr-2 border-r border-stone-700 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-800/40 text-amber-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Compare</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{items.length} of 4 items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.map((prod) => (
              <div
                key={prod.id}
                className="relative group w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 overflow-hidden shrink-0"
                title={prod.name}
              >
                <img
                  src={prod.images?.[0]?.url || 'https://via.placeholder.com/80'}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeItem(prod.id)}
                  className="absolute inset-0 bg-stone-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from comparison"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={clearItems}
            className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
          <Link
            to="/compare"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
