import React, { useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  Flame,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const OverspendingView: React.FC = () => {
  const { budgets, transactions, currency, mode } = useFinance();

  // Categorize budgets into Danger (>=100%), Warning (>=80% and <100%), Safe (<80%)
  const { dangerBudgets, warningBudgets, safeBudgets } = useMemo(() => {
    const danger = [];
    const warning = [];
    const safe = [];

    for (const b of budgets) {
      if (b.monthlyLimit <= 0) continue;
      const pct = Math.round((b.spent / b.monthlyLimit) * 100);
      if (pct >= 100) {
        danger.push({ ...b, percent: pct });
      } else if (pct >= (b.alertThresholdPercent || 80)) {
        warning.push({ ...b, percent: pct });
      } else {
        safe.push({ ...b, percent: pct });
      }
    }

    return {
      dangerBudgets: danger.sort((a, b) => b.percent - a.percent),
      warningBudgets: warning.sort((a, b) => b.percent - a.percent),
      safeBudgets: safe.sort((a, b) => a.percent - b.percent),
    };
  }, [budgets]);

  // Detect individual large transaction anomalies (transactions > 35% of category limit or > $150 in student mode / > $400 in pro mode)
  const anomalies = useMemo(() => {
    const threshold = mode === 'student' ? 45 : 200;
    return transactions
      .filter((t) => t.type === 'expense' && t.amount >= threshold)
      .slice(0, 5);
  }, [transactions, mode]);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>Overspending Detection & Watchdog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time heuristic monitor tracking category burn rates and anomalous spikes
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold font-mono-numbers">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{dangerBudgets.length} Exceeded</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold font-mono-numbers">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{warningBudgets.length} Near Limit</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold font-mono-numbers">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{safeBudgets.length} Healthy</span>
          </div>
        </div>
      </div>

      {/* Critical Exceeded Alerts */}
      {dangerBudgets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Critical: Budgets Exceeded (Over 100%)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dangerBudgets.map((b) => (
              <div
                key={b.id}
                className="bg-gradient-to-r from-rose-950/50 via-slate-900/90 to-rose-950/30 border border-rose-800/80 rounded-2xl p-5 shadow-lg space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-100">{b.category}</span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-bold font-mono-numbers">
                    {b.percent}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2.5 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="flex items-center justify-between font-mono-numbers text-slate-300">
                  <span>
                    Spent: <strong className="text-rose-400">{formatCurrency(b.spent, currency)}</strong>
                  </span>
                  <span>Limit: {formatCurrency(b.monthlyLimit, currency)}</span>
                  <span className="text-rose-300 font-bold">
                    Over by +{formatCurrency(b.spent - b.monthlyLimit, currency)}
                  </span>
                </div>

                <div className="pt-2 border-t border-rose-900/40 text-slate-400 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-200">FinAgent Containment:</strong> Pause discretionary purchases in {b.category} for the remainder of this cycle or reallocate surplus from safe categories.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approaching Limit Warnings */}
      {warningBudgets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Warning: Approaching Limit (80% - 99%)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningBudgets.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900/80 border border-amber-900/60 rounded-2xl p-5 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-100">{b.category}</span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono-numbers border border-amber-500/30">
                    {b.percent}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
                    style={{ width: `${b.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between font-mono-numbers text-slate-300">
                  <span>Spent: {formatCurrency(b.spent, currency)}</span>
                  <span>Limit: {formatCurrency(b.monthlyLimit, currency)}</span>
                  <span className="text-amber-400 font-semibold">
                    Remaining: {formatCurrency(b.monthlyLimit - b.spent, currency)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-200">Advisory:</strong> Pace expenses carefully over remaining days to avoid spilling into deficit.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalous Spikes Detection Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Anomalous High-Impact Transactions Detected</span>
            </h3>
            <p className="text-xs text-slate-400">
              Single-transaction spikes that accelerated monthly category exhaustion
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {anomalies.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-200 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-indigo-300">{tx.category}</span>
                  <span>•</span>
                  <span>{tx.date}</span>
                  <span>•</span>
                  <span>{tx.paymentMethod}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold font-mono-numbers text-sm text-rose-400">
                  -{formatCurrency(tx.amount, currency)}
                </span>
                <span className="block text-[10px] text-amber-400 font-mono">
                  High-Burn Flag
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
