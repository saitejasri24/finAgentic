import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Bot,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Printer,
  Calendar,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { MonthlyFinancialReport } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const FinancialReportView: React.FC = () => {
  const { profile, transactions, budgets, savingsGoals, currency } = useFinance();

  const [report, setReport] = useState<MonthlyFinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          transactions,
          budgets,
          goals: savingsGoals,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReport(data);
      }
    } catch (e) {
      console.error('Failed fetching report:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [profile.mode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Monthly AI Financial Health Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated comprehensive synthesis for billing cycle: September 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synthesizing...' : 'Regenerate'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {isLoading && !report && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
          <Bot className="w-8 h-8 text-indigo-400 animate-spin" />
          <p>FinAgent is evaluating your transactions, category ratios, and goal vectors...</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/40 border border-indigo-800/50 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-slate-950 border border-indigo-500/40 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-indigo-950/50">
                <span className="text-3xl font-extrabold font-mono-numbers text-indigo-300">
                  {report.financialHealthScore}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  {report.scoreLabel} Financial Trajectory
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  FinAgent Health Assessment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                  {report.agentSummary}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 bg-slate-950/60 border border-slate-800/80 px-4 py-3 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Projected Annual Savings
              </p>
              <p className="text-xl font-bold font-mono-numbers text-emerald-400">
                {formatCurrency(report.projectedAnnualSavings, currency)}
              </p>
              <span className="text-[10px] text-slate-500">at current net run-rate</span>
            </div>
          </div>

          {/* Actual Records Summary Row (Clearly Marked) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Actual Financial Records (Audit Period)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Verified Ledger Values
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="text-slate-400">Total Income</span>
                <p className="text-xl font-bold font-mono-numbers text-emerald-400 mt-1">
                  {formatCurrency(report.totalIncome, currency)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="text-slate-400">Total Expenses</span>
                <p className="text-xl font-bold font-mono-numbers text-rose-400 mt-1">
                  {formatCurrency(report.totalExpenses, currency)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="text-slate-400">Net Monthly Savings</span>
                <p className="text-xl font-bold font-mono-numbers text-indigo-300 mt-1">
                  {formatCurrency(report.netSavings, currency)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="text-slate-400">Savings Rate</span>
                <p className="text-xl font-bold font-mono-numbers text-slate-100 mt-1">
                  {report.savingsRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Major Spending Categories Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm text-xs">
            <h3 className="font-bold text-slate-100 text-sm mb-3">
              Major Spending Categories Breakdown
            </h3>

            <div className="space-y-3">
              {report.majorCategories.map((cat, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5 font-mono-numbers">
                    <span className="font-bold text-slate-200">{cat.category}</span>
                    <span className="text-slate-300">
                      {formatCurrency(cat.amount, currency)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unusual Spending & Leaks Detected */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm text-xs">
            <h3 className="font-bold text-slate-100 text-sm mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Unusual Spending & Potential Leaks</span>
            </h3>
            <p className="text-slate-400 text-xs mb-3">
              FinAgent pattern recognition identified the following high-burn areas
            </p>

            <div className="space-y-2">
              {report.unusualSpending.map((u, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{u.item}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                          u.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {u.severity} anomaly
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{u.reason}</p>
                  </div>
                  <span className="font-bold font-mono-numbers text-slate-200 shrink-0">
                    {formatCurrency(u.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Suggestions (AI Estimates/Suggestions) */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 border border-indigo-800/50 rounded-2xl p-5 shadow-sm text-xs">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Personalized AI Strategic Recommendations
              </h3>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              Actionable steps tailored specifically to your spending velocity and active goals
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.personalizedSuggestions.map((sug, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950/70 border border-indigo-900/30 flex items-start gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 leading-relaxed">{sug}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
