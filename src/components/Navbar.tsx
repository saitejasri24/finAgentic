import React, { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Plus,
  Bell,
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Bot,
  Zap,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

interface NavbarProps {
  onOpenAddModal: () => void;
  onNavigateToTab: (tabId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddModal, onNavigateToTab }) => {
  const {
    profile,
    mode,
    switchUser,
    currency,
    setCurrency,
    overspendingAlerts,
    upcomingBillsCount,
    bills,
    isAgentRunning,
    runAgentCycle,
  } = useFinance();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const totalNotifications = overspendingAlerts.length + upcomingBillsCount;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                FinAgent
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  AI Core
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Personal Finance Agent
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => switchUser('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'student'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Mode</span>
          </button>
          <button
            onClick={() => switchUser('professional')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'professional'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Pro Mode</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Selector */}
          <div className="relative hidden md:block">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2 py-1.5 outline-none hover:border-slate-700 cursor-pointer"
            >
              <option value="$">$ USD</option>
              <option value="₹">₹ INR</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
              <option value="C$">C$ CAD</option>
            </select>
          </div>

          {/* Run Agent Cycle Trigger */}
          <button
            onClick={() => runAgentCycle()}
            disabled={isAgentRunning}
            title="Trigger real-time FinAgent audit & rebalance cycle"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 text-xs font-medium transition-all"
          >
            <Bot className={`w-3.5 h-3.5 ${isAgentRunning ? 'text-indigo-400 animate-spin' : 'text-indigo-400'}`} />
            <span>{isAgentRunning ? 'Auditing...' : 'Agent Cycle'}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors"
              title="Alerts and Reminders"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalNotifications}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div
                className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-3 z-50 animate-fade-in"
                onMouseLeave={() => setShowAlertsDropdown(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-200">
                  <span>FinAgent Live Alerts</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {totalNotifications} active
                  </span>
                </div>

                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {overspendingAlerts.length === 0 && upcomingBillsCount === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      All budgets and bills are currently safe!
                    </p>
                  )}

                  {overspendingAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => {
                        onNavigateToTab('overspending');
                        setShowAlertsDropdown(false);
                      }}
                      className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/40 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {alt.percent >= 100 ? 'Budget Exceeded:' : 'Approaching Limit:'}{' '}
                          {alt.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Spent {formatCurrency(alt.spent, currency)} of {formatCurrency(alt.limit, currency)} ({alt.percent}%)
                      </p>
                    </div>
                  ))}

                  {bills
                    .filter((b) => !b.isPaid)
                    .slice(0, 3)
                    .map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          onNavigateToTab('bills');
                          setShowAlertsDropdown(false);
                        }}
                        className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:bg-slate-800 cursor-pointer transition-colors text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Upcoming: {b.title}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 flex justify-between">
                          <span>Due {b.dueDate}</span>
                          <span className="font-semibold text-slate-200">
                            {formatCurrency(b.amount, currency)}
                          </span>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>

          {/* User Profile Mini Badge */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="text-left hidden xl:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {profile.name}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {profile.mode} Account
                </p>
              </div>
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-7 h-7 rounded-lg object-cover border border-slate-700"
              />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-3 z-50 animate-fade-in"
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-200">{profile.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
                    Quick Persona Switcher
                  </p>
                  <button
                    onClick={() => {
                      switchUser('student');
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      mode === 'student' ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Alex Chen (Student)</span>
                    </div>
                    {mode === 'student' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => {
                      switchUser('professional');
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      mode === 'professional' ? 'bg-emerald-600/20 text-emerald-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sarah Jenkins (Pro)</span>
                    </div>
                    {mode === 'professional' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
