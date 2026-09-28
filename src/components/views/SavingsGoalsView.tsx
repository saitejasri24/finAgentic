import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Bot,
  Calendar,
  DollarSign,
  Laptop,
  GraduationCap,
  ShieldCheck,
  Plane,
  Car,
  Heart,
  TrendingUp,
  X,
  Check,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsGoal } from '../../types/finance';
import { formatCurrency, getDaysRemainingUntil } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const SavingsGoalsView: React.FC = () => {
  const {
    savingsGoals,
    addSavingsGoal,
    depositToGoal,
    deleteGoal,
    currency,
    profile,
    remainingBalance,
    totalExpenses,
    mode,
  } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<SavingsGoal['category']>('Tech');

  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [advisoryGoalId, setAdvisoryGoalId] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [customAdvice, setCustomAdvice] = useState<{ [id: string]: { advice: string; steps: string[] } }>({});

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tAmt = parseFloat(targetAmount);
    if (!goalTitle.trim() || !tAmt || tAmt <= 0) return;

    await addSavingsGoal({
      title: goalTitle.trim(),
      targetAmount: tAmt,
      currentAmount: parseFloat(initialAmount) || 0,
      targetDate: targetDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category,
      icon: category === 'Tech' ? 'Laptop' : category === 'Education' ? 'GraduationCap' : 'ShieldCheck',
    });

    setGoalTitle('');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate('');
    setShowAddModal(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal) return;
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;

    depositToGoal(depositModalGoal.id, amt);
    setDepositAmount('');
    setDepositModalGoal(null);
  };

  const handleFetchAiAdvice = async (goal: SavingsGoal) => {
    setAdvisoryGoalId(goal.id);
    setLoadingAdvice(true);

    try {
      const res = await fetch('/api/agent/goal-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.title,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate,
          monthlyIncome: profile.monthlyIncome,
          currentMonthlyExpenses: totalExpenses,
          mode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCustomAdvice((prev) => ({
          ...prev,
          [goal.id]: {
            advice: data.aiAdvice,
            steps: data.actionSteps || [],
          },
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>AI Savings Goal Planner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Model milestones, calculate monthly velocity, and receive automated acceleration directives
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savingsGoals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const daysLeft = getDaysRemainingUntil(goal.targetDate);
          const remainingToSave = Math.max(0, goal.targetAmount - goal.currentAmount);
          const adviceInfo = customAdvice[goal.id];

          return (
            <div
              key={goal.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all text-xs"
            >
              <div>
                {/* Top Title and Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20 shrink-0">
                      {goal.category === 'Tech' && <Laptop className="w-4 h-4" />}
                      {goal.category === 'Education' && <GraduationCap className="w-4 h-4" />}
                      {goal.category === 'Emergency' && <ShieldCheck className="w-4 h-4" />}
                      {goal.category === 'Travel' && <Plane className="w-4 h-4" />}
                      {goal.category === 'Vehicle' && <Car className="w-4 h-4" />}
                      {goal.category === 'Lifestyle' && <Heart className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{goal.title}</h3>
                      <span className="text-[10px] text-slate-400">{goal.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Metric */}
                <div className="flex items-baseline justify-between font-mono-numbers my-2">
                  <span className="text-xl font-bold text-slate-100">
                    {formatCurrency(goal.currentAmount, currency)}
                  </span>
                  <span className="text-slate-400 text-xs">
                    of {formatCurrency(goal.targetAmount, currency)} ({percent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 my-2 overflow-hidden border border-slate-800/80">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* AI Suggested Monthly Rate Badge */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">AI Suggested Monthly:</span>
                    <span className="font-bold font-mono-numbers text-emerald-400">
                      {formatCurrency(goal.suggestedMonthlySaving, currency)} / mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target Date: {goal.targetDate}</span>
                    <span>{daysLeft} days left</span>
                  </div>

                  {goal.feasibilityScore && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                      <span className="text-slate-500">Feasibility:</span>
                      <span
                        className={`font-semibold font-mono text-[10px] px-1.5 py-0.2 rounded ${
                          goal.feasibilityScore === 'High'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {goal.feasibilityScore} Feasibility
                      </span>
                    </div>
                  )}
                </div>

                {/* Goal Advice / Advice Box */}
                {(adviceInfo || goal.aiAdvice) && (
                  <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-slate-300">
                    <p className="font-semibold text-indigo-300 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>FinAgent Advice:</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      {adviceInfo ? adviceInfo.advice : goal.aiAdvice}
                    </p>
                    {adviceInfo?.steps && (
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {adviceInfo.steps.map((st, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleFetchAiAdvice(goal)}
                  disabled={loadingAdvice && advisoryGoalId === goal.id}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  <Bot className={`w-3.5 h-3.5 ${loadingAdvice && advisoryGoalId === goal.id ? 'animate-spin' : ''}`} />
                  <span>Accelerate Plan</span>
                </button>

                <button
                  onClick={() => setDepositModalGoal(goal)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  + Add Deposit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {depositModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm">
                Deposit to "{depositModalGoal.title}"
              </h3>
              <button
                onClick={() => setDepositModalGoal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Deposit Amount ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono-numbers text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick deposit chips */}
              <div className="flex items-center gap-2">
                {[25, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val.toString())}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono-numbers text-xs"
                  >
                    +{currency}{val}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm">Create New Savings Goal</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGoalSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={mode === 'student' ? 'e.g. M3 MacBook Air, Semester Exam Fee' : 'e.g. Emergency Reserve, Japan Vacation'}
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Target Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono-numbers outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Already Saved ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono-numbers outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="Tech">Tech & Gadgets</option>
                    <option value="Education">Education & Fees</option>
                    <option value="Emergency">Emergency Reserve</option>
                    <option value="Travel">Travel & Trips</option>
                    <option value="Vehicle">Vehicle / Transport</option>
                    <option value="Lifestyle">Lifestyle & Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
