import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !compact) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-md px-2.5 py-1">
        <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-slate-300 font-medium">Disclaimer:</strong> AI-generated estimates & suggestions are for informational and planning purposes only and do not constitute certified financial advice.
        </span>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30 border border-indigo-900/40 rounded-xl p-3.5 shadow-sm text-xs text-slate-300 mb-6 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="font-semibold text-slate-200">
            Advisory Notice: FinAgent AI-Assisted Financial Intelligence
          </p>
          <p className="text-slate-400 mt-0.5 leading-relaxed">
            AI-generated category estimates, budget plans, overspending alerts, and chatbot recommendations are automated projections designed for decision support. They do not constitute licensed legal, tax, or investment advice. Always verify with actual banking records.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
