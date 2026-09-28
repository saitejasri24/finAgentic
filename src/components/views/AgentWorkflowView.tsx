import React from 'react';
import {
  Network,
  Database,
  Cpu,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Bot,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const AgentWorkflowView: React.FC = () => {
  const { agentWorkflow, runAgentCycle, isAgentRunning, transactions, budgets, savingsGoals } = useFinance();

  const workflowSteps = [
    {
      id: 'collecting',
      step: 1,
      title: 'Data Collection & Normalization',
      icon: Database,
      desc: 'Ingests income, expense transactions, payment rails (UPI, cards, cash), and tags into structured financial records.',
      status: agentWorkflow.currentStage === 'collecting' ? 'active' : 'ready',
      metrics: `${transactions.length} records ingested`,
    },
    {
      id: 'analyzing',
      step: 2,
      title: 'Pattern Recognition & Categorization',
      icon: Cpu,
      desc: 'Applies Gemini semantic reasoning to classify merchants, identify recurring bills, and calculate category consumption velocity.',
      status: agentWorkflow.currentStage === 'analyzing' ? 'active' : 'ready',
      metrics: 'Categorization & velocity mapped',
    },
    {
      id: 'monitoring',
      step: 3,
      title: 'Watchdog & Overspending Detection',
      icon: ShieldAlert,
      desc: 'Monitors category burn rates against monthly limits in real time. Flags threshold leaks (>80%) and anomalous single-purchase spikes.',
      status: agentWorkflow.currentStage === 'monitoring' ? 'active' : 'ready',
      metrics: `${budgets.length} budgets under surveillance`,
    },
    {
      id: 'recommending',
      step: 4,
      title: 'Personalized Strategic Recommendations',
      icon: Sparkles,
      desc: 'Synthesizes personalized budgets, computes safe daily pocket run-rates (student mode), and models milestone timelines.',
      status: agentWorkflow.currentStage === 'recommending' ? 'active' : 'ready',
      metrics: `${savingsGoals.length} goals modeled`,
    },
    {
      id: 'updating',
      step: 5,
      title: 'Continuous Adaptive Feedback Loop',
      icon: RefreshCw,
      desc: 'Dynamically rebalances category weights, adapts chatbot memory, and updates recommendations whenever new records arrive.',
      status: agentWorkflow.currentStage === 'updating' ? 'active' : 'ready',
      metrics: 'Live adaptive feedback',
    },
  ];

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header and Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Autonomous Agentic Financial Pipeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent visualization of FinAgent’s 5-stage data collection, reasoning, and adaptive feedback loop
          </p>
        </div>

        <button
          onClick={runAgentCycle}
          disabled={isAgentRunning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isAgentRunning ? 'animate-spin' : ''}`} />
          <span>{isAgentRunning ? 'Executing Agent Loop...' : 'Trigger Live Agent Cycle'}</span>
        </button>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {workflowSteps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.status === 'active';

          return (
            <div
              key={s.id}
              className={`p-4 rounded-2xl border transition-all text-xs flex flex-col justify-between relative overflow-hidden ${
                isActive
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-indigo-400 text-xs">
                    {s.step}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h4 className="font-bold text-slate-100 text-xs leading-snug mb-1">{s.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{s.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono font-semibold text-slate-400 block truncate">
                  {s.metrics}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Agent Event Logs */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm text-xs">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-slate-100">Live Agent Audit Stream & Memory</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Last executed: {agentWorkflow.lastRunTimestamp}
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {agentWorkflow.logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.type === 'warning'
                      ? 'bg-amber-400'
                      : log.type === 'alert'
                      ? 'bg-rose-400'
                      : log.type === 'success'
                      ? 'bg-emerald-400'
                      : 'bg-indigo-400'
                  }`}
                />
                <div className="min-w-0">
                  <span className="font-mono text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                    [{log.stage}]
                  </span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{log.message}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
