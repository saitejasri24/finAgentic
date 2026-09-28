import React, { useState } from 'react';
import {
  Sparkles,
  PieChart,
  Bot,
  Check,
  Plus,
  Edit2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const BudgetPlannerView: React.FC = () => {
  const {
    budgets,
    updateBudgetLimit,
    applyAIBudgetPlan,
    addBudgetCategory,
    profile,
    mode,
    currency,
  } = useFinance();

  const [incomeInput, setIncomeInput] = useState<string>(profile.monthlyIncome.toString());
  const [goalsInput, setGoalsInput] = useState<string>(profile.financialGoals);
  const [targetSavingsRate, setTargetSavingsRate] = useState<number>(profile.targetSavingsRate || 20);
  const [fixedObligations, setFixedObligations] = useState<string>(
    mode === 'student' ? 'Hostel fee $300, Campus mess minimum' : 'Rent $1950, utilities and insurance'
  );

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiPlan, setAiPlan] = useState<{
    recommendedSavings: number;
    categories: { category: string; limit: number; color?: string; icon?: string; reasoning?: string }[];
    agentRationale: string;
    keyTips: string[];
  } | null>(null);

  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<string>('');

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLimit, setCustomLimit] = useState('');

  const handleGenerateBudget = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/agent/budget-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: parseFloat(incomeInput) || profile.monthlyIncome,
          mode,
          goals: goalsInput,
          existingObligations: fixedObligations,
          targetSavingsRate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiPlan({
          recommendedSavings: data.recommendedSavings,
          categories: data.categories,
          agentRationale: data.agentRationale,
          keyTips: data.keyTips || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleApplyAiPlan = () => {
    if (!aiPlan) return;
    applyAIBudgetPlan(aiPlan.categories);
  };

  const handleSaveBudgetLimit = (id: string) => {
    const val = parseFloat(editingLimit);
    if (!isNaN(val) && val > 0) {
      updateBudgetLimit(id, val);
    }
    setEditingBudgetId(null);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customLimit) return;
    addBudgetCategory(customName.trim(), parseFloat(customLimit) || 100);
    setCustomName('');
    setCustomLimit('');
    setShowAddCustom(false);
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <span>AI-Powered Budget Planner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic allocation engine tailored to your income, mode, and target savings rate
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-numbers bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">
              Total Monthly Caps
            </span>
            <span className="text-slate-200 font-bold text-sm">
              {formatCurrency(totalBudgeted, currency)}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-slate-800" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">
              Stated Income
            </span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatCurrency(parseFloat(incomeInput) || profile.monthlyIncome, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Active Category Budgets vs Current Spend */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Active Category Budgets & Consumption
            </h3>
            <p className="text-xs text-slate-400">
              Live spending tracked against your designated limits
            </p>
          </div>

          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Add custom modal inline */}
        {showAddCustom && (
          <form
            onSubmit={handleAddCustomCategory}
            className="mb-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3 text-xs animate-fade-in"
          >
            <input
              type="text"
              placeholder="Category Name"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder={`Monthly Limit (${currency})`}
              required
              value={customLimit}
              onChange={(e) => setCustomLimit(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-indigo-500 font-mono-numbers"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const percent = Math.round((b.spent / b.monthlyLimit) * 100);
            const isOver = percent >= 100;
            const isNear = percent >= 80 && percent < 100;
            const isEditing = editingBudgetId === b.id;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl bg-slate-950/70 border transition-all text-xs ${
                  isOver
                    ? 'border-rose-900/60 shadow-sm shadow-rose-950/30'
                    : isNear
                    ? 'border-amber-900/50'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.color || '#3b82f6' }}
                    />
                    <span className="font-bold text-slate-200 text-sm truncate">
                      {b.category}
                    </span>
                  </div>

                  <span
                    className={`font-mono-numbers font-bold text-xs px-2 py-0.5 rounded-md ${
                      isOver
                        ? 'bg-rose-500/20 text-rose-300'
                        : isNear
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 my-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isOver
                        ? 'bg-rose-500'
                        : isNear
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-slate-400 font-mono-numbers mt-3">
                  <span>
                    Spent: <strong className="text-slate-200">{formatCurrency(b.spent, currency)}</strong>
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editingLimit}
                        onChange={(e) => setEditingLimit(e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-100 font-mono text-xs"
                      />
                      <button
                        onClick={() => handleSaveBudgetLimit(b.id)}
                        className="p-1 rounded bg-indigo-600 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span>Limit: {formatCurrency(b.monthlyLimit, currency)}</span>
                      <button
                        onClick={() => {
                          setEditingBudgetId(b.id);
                          setEditingLimit(b.monthlyLimit.toString());
                        }}
                        className="p-1 text-slate-500 hover:text-slate-300"
                        title="Edit limit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Budget Generator Input Form */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Generate Personalized AI Budget Plan
            </h3>
            <p className="text-xs text-slate-400">
              Provide your income & goals and FinAgent will calculate optimal category boundaries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Monthly Inflow / Income ({currency}) *
            </label>
            <input
              type="number"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono-numbers outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Target Monthly Savings Rate (%)
            </label>
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={targetSavingsRate}
                onChange={(e) => setTargetSavingsRate(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono-numbers text-indigo-400 font-bold w-10 text-right">
                {targetSavingsRate}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Mode Persona
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold capitalize flex items-center justify-between">
              <span>{mode} Mode</span>
              <span className="text-[11px] text-slate-500">
                {mode === 'student' ? '🎓 Campus Allocations' : '💼 Professional Allocations'}
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">
              Financial Goals & Priorities
            </label>
            <input
              type="text"
              value={goalsInput}
              onChange={(e) => setGoalsInput(e.target.value)}
              placeholder="e.g. Save $1,200 for laptop, keep food costs in check"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Fixed Obligations
            </label>
            <input
              type="text"
              value={fixedObligations}
              onChange={(e) => setFixedObligations(e.target.value)}
              placeholder="e.g. Room rent, minimum mess fee"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={handleGenerateBudget}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>{isLoadingAi ? 'Calculating Optimal Model...' : 'Generate AI Budget Plan'}</span>
          </button>
        </div>
      </div>

      {/* Generated AI Budget Plan Result */}
      {aiPlan && (
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 border border-indigo-700/50 rounded-2xl p-6 shadow-xl space-y-5 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-900/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30">
                  AI Generated Solution
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  Recommended Monthly Blueprint
                </h3>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Projected Monthly Savings Target:{' '}
                <strong className="text-emerald-400 font-mono-numbers">
                  {formatCurrency(aiPlan.recommendedSavings, currency)}
                </strong>
              </p>
            </div>

            <button
              onClick={handleApplyAiPlan}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Active Budgets</span>
            </button>
          </div>

          {/* Rationale */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>FinAgent Strategy Rationale:</span>
            </p>
            <p className="text-slate-400">{aiPlan.agentRationale}</p>
          </div>

          {/* Recommended Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiPlan.categories.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950/70 border border-indigo-900/30 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{c.category}</span>
                  <span className="font-mono-numbers font-bold text-indigo-300">
                    {formatCurrency(c.limit, currency)}
                  </span>
                </div>
                {c.reasoning && (
                  <p className="text-[11px] text-slate-400 mt-2 italic">
                    {c.reasoning}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Key Tips */}
          {aiPlan.keyTips && aiPlan.keyTips.length > 0 && (
            <div className="pt-2">
              <p className="font-semibold text-slate-300 mb-2">Actionable Directives:</p>
              <ul className="space-y-1 text-slate-400">
                {aiPlan.keyTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
