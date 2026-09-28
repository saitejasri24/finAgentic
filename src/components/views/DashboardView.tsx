import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Plus,
  Clock,
  ChevronRight,
  Target,
  Calendar,
  GraduationCap,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, getDaysRemainingInMonth } from '../../utils/formatters';
import { CategoryPieChart } from '../charts/CategoryPieChart';
import { ExpenseTrendChart } from '../charts/ExpenseTrendChart';
import { DisclaimerBanner } from '../DisclaimerBanner';

interface DashboardViewProps {
  onOpenAddModal: () => void;
  onNavigateToTab: (tabId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddModal,
  onNavigateToTab,
}) => {
  const {
    profile,
    mode,
    currency,
    totalIncome,
    totalExpenses,
    remainingBalance,
    monthlySavings,
    savingsRate,
    dailyAllowance,
    categorySpending,
    overspendingAlerts,
    savingsGoals,
    bills,
    transactions,
  } = useFinance();

  const daysRemaining = getDaysRemainingInMonth();
  const recentTransactions = transactions.slice(0, 6);
  const pendingBills = bills.filter((b) => !b.isPaid).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Disclaimer Notice */}
      <DisclaimerBanner />

      {/* Overspending Alert Banner if critical */}
      {overspendingAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900/60 to-rose-950/20 border border-rose-900/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-200">
                FinAgent Watchdog: {overspendingAlerts.length} Spending Alert{overspendingAlerts.length > 1 ? 's' : ''} Detected
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {overspendingAlerts[0].category} has reached {overspendingAlerts[0].percent}% of its monthly cap.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('overspending')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <span>Review Watchdog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-100">
            {formatCurrency(totalIncome, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Positive cash flow</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-100">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-medium">
            <span className="font-mono-numbers text-slate-300">
              {totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%
            </span>
            <span>of monthly income</span>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Remaining Balance</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-indigo-300">
            {formatCurrency(remainingBalance, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 mt-2 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Unallocated cushion</span>
          </div>
        </div>

        {/* Monthly Savings & Rate */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Monthly Savings Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-100">
            {savingsRate}%
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-medium">
            <span>{formatCurrency(monthlySavings, currency)} saved this month</span>
          </div>
        </div>
      </div>

      {/* Student Mode Specific Spotlight Widget */}
      {mode === 'student' && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-purple-950/40 border border-indigo-800/40 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    Student Pocket Run-Rate & Daily Allowance
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Safe Daily Cap
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  FinAgent dynamically budgets your remaining allowance over the next {daysRemaining} days.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Safe Daily Allowance
                </p>
                <p className="text-xl font-bold font-mono-numbers text-emerald-400">
                  {formatCurrency(dailyAllowance, currency)}
                  <span className="text-xs text-slate-400 font-normal"> / day</span>
                </p>
              </div>
              <div className="h-8 w-[1px] bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Days in Month
                </p>
                <p className="text-xl font-bold font-mono-numbers text-indigo-300">
                  {daysRemaining}
                  <span className="text-xs text-slate-400 font-normal"> days left</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (Donut) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Spending by Category</h3>
              <p className="text-xs text-slate-400">
                Interactive distribution of all expense channels
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('budget-planner')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View Budgets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CategoryPieChart
            categories={categorySpending}
            totalExpense={totalExpenses}
            currency={currency}
          />
        </div>

        {/* Expense Timeline Trend */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Expense & Cashflow Trend</h3>
                <p className="text-xs text-slate-400">
                  Daily timeline tracking inflows vs outflows
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('transactions')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>All Transactions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ExpenseTrendChart
              transactions={transactions}
              currency={currency}
            />
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Average daily spend:</span>
            <span className="font-mono-numbers font-semibold text-slate-200">
              {formatCurrency(totalExpenses / 30, currency)}/day
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity & Quick Planner Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Recent Transactions</h3>
              <p className="text-xs text-slate-400">
                Latest transactions with automated FinAgent classification
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Record</span>
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700/80 transition-all text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="font-mono">{tx.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <p
                    className={`font-bold font-mono-numbers text-sm ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                  {tx.aiCategorized && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-indigo-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      {Math.round((tx.aiConfidence || 0.95) * 100)}% AI
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Mini Widgets (Savings Goals & Pending Bills) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Savings Goals Snapshot */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">Savings Goals</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('savings-goals')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {savingsGoals.slice(0, 2).map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );
                return (
                  <div
                    key={goal.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-200 mb-1">
                      <span className="truncate pr-2">{goal.title}</span>
                      <span className="font-mono-numbers text-indigo-400 font-bold shrink-0">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 my-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-numbers">
                      <span>{formatCurrency(goal.currentAmount, currency)} saved</span>
                      <span>Target: {formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Bills Snapshot */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Upcoming Bills</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('bills')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {pendingBills.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  All active bills are marked paid!
                </p>
              ) : (
                pendingBills.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-200 truncate">{b.title}</p>
                      <p className="text-[11px] text-slate-400">Due {b.dueDate}</p>
                    </div>
                    <span className="font-bold font-mono-numbers text-slate-100 shrink-0">
                      {formatCurrency(b.amount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
