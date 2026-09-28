import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ChatMessage } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const AIChatbotView: React.FC = () => {
  const {
    profile,
    transactions,
    budgets,
    savingsGoals,
    bills,
    totalIncome,
    totalExpenses,
    remainingBalance,
    monthlySavings,
    categorySpending,
    mode,
    currency,
  } = useFinance();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initialGreeting: ChatMessage = {
    id: 'msg_welcome',
    sender: 'agent',
    text: `Hello ${profile.name}! I am **FinAgent**, your autonomous personal finance advisor. I have complete real-time access to your current ledger:
- **Total Income**: ${formatCurrency(totalIncome, currency)}
- **Total Expenses**: ${formatCurrency(totalExpenses, currency)}
- **Remaining Balance**: ${formatCurrency(remainingBalance, currency)}
- **Current Mode**: ${mode === 'student' ? 'Student Edition 🎓' : 'Professional Edition 💼'}

Ask me anything about your spending, leaks, or how to accelerate your goals!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedQuestions: [
      'Where am I spending the most?',
      'How much did I spend on food this month?',
      'How can I save more money?',
      'Can I afford a $150 purchase right now?',
    ],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.slice(-6).map((m) => ({ role: m.sender, text: m.text })),
          context: {
            profile,
            totalIncome,
            totalExpenses,
            netBalance: remainingBalance,
            monthlySavings,
            topCategories: categorySpending,
            recentTransactions: transactions.slice(0, 15),
            budgets,
            savingsGoals,
            upcomingBills: bills.filter((b) => !b.isPaid),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const agentMessage: ChatMessage = {
          id: `msg_agent_${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metricHighlights: data.metricHighlights || [],
          suggestedQuestions: data.suggestedQuestions || [],
        };
        setMessages((prev) => [...prev, agentMessage]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'agent',
        text: `Based on your live accounts, your remaining balance is **${formatCurrency(remainingBalance, currency)}** across **${transactions.length}** tracked transactions. Top spending is in **${categorySpending[0]?.category || 'General'}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <DisclaimerBanner compact />

      {/* Chat Container Card */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-[1px] flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">FinAgent Advisor</h3>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Grounded in Live Records
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Contextual querying powered by Gemini 3.8 Flash
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block text-xs font-mono-numbers">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Active Cash</span>
            <span className="text-emerald-400 font-bold">
              {formatCurrency(remainingBalance, currency)}
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? 'items-start' : 'items-end justify-end'}`}
              >
                {isAgent && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-3 ${
                    isAgent
                      ? 'bg-slate-950/80 border border-slate-800/80 text-slate-200'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  }`}
                >
                  {/* Message Text with simple markdown formatting */}
                  <div className="whitespace-pre-line leading-relaxed text-xs">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <div key={idx} className="flex items-start gap-2 my-1">
                            <span className="text-indigo-400 mt-1">•</span>
                            <span>{renderFormattedText(line.substring(2))}</span>
                          </div>
                        );
                      }
                      if (line.match(/^\d+\.\s/)) {
                        return (
                          <div key={idx} className="flex items-start gap-2 my-1">
                            <span className="font-mono text-indigo-400 font-bold">
                              {line.split('.')[0]}.
                            </span>
                            <span>{renderFormattedText(line.replace(/^\d+\.\s/, ''))}</span>
                          </div>
                        );
                      }
                      return <p key={idx} className="my-0.5">{renderFormattedText(line)}</p>;
                    })}
                  </div>

                  {/* Metric Highlights if present */}
                  {msg.metricHighlights && msg.metricHighlights.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                      {msg.metricHighlights.map((m, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]"
                        >
                          <span className="text-slate-400 block text-[10px]">{m.label}</span>
                          <span
                            className={`font-bold font-mono-numbers ${
                              m.status === 'warning'
                                ? 'text-rose-400'
                                : m.status === 'positive'
                                ? 'text-emerald-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">
                        Suggested Follow-ups:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{q}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[9px] font-mono text-right ${
                      isAgent ? 'text-slate-500' : 'text-indigo-200'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {!isAgent && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0 mb-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>FinAgent is consulting your financial records and calculating advice...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about spending, food budget, saving tips, or large purchases..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Simple bolding helper for markdown strings (**bold**)
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-slate-100 font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
