import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  AlertOctagon,
  Target,
  FileText,
  CalendarClock,
  MessageSquareCode,
  Network,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { overspendingAlerts, upcomingBillsCount, transactions, mode } = useFinance();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Receipt,
      badge: transactions.length,
    },
    {
      id: 'budget-planner',
      label: 'AI Budget Planner',
      icon: PieChart,
      isAi: true,
    },
    {
      id: 'overspending',
      label: 'Overspending Watch',
      icon: AlertOctagon,
      badge: overspendingAlerts.length > 0 ? overspendingAlerts.length : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'savings-goals',
      label: 'Savings Goals',
      icon: Target,
      badge: null,
    },
    {
      id: 'ai-report',
      label: 'AI Financial Report',
      icon: FileText,
      isAi: true,
    },
    {
      id: 'bills',
      label: 'Bills & Reminders',
      icon: CalendarClock,
      badge: upcomingBillsCount > 0 ? upcomingBillsCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'chatbot',
      label: 'FinAgent Advisor',
      icon: MessageSquareCode,
      isAi: true,
      highlight: true,
    },
    {
      id: 'agent-workflow',
      label: 'Agentic Workflow',
      icon: Network,
      isAi: true,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-950 border-r border-slate-800/80 p-3 lg:p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            Finance Operating System
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-950/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-indigo-400 group-hover:text-indigo-300'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.isAi && !isActive && (
                    <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      AI
                    </span>
                  )}
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Status Pill at Bottom */}
      <div className="pt-4 border-t border-slate-900 mt-6">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Current Profile</span>
            <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              {mode === 'student' ? '🎓' : '💼'}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 capitalize">
                {mode} Edition
              </p>
              <p className="text-[10px] text-slate-400">
                {mode === 'student' ? 'Pocket money & campus' : 'Salary & investments'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
