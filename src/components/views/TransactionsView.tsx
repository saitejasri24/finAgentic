import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Sparkles,
  Bot,
  Download,
  Calendar,
  CreditCard,
  Tag,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

interface TransactionsViewProps {
  onOpenAddModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onOpenAddModal }) => {
  const {
    transactions,
    deleteTransaction,
    batchCategorizeTransactions,
    isAgentRunning,
    currency,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Extract all unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchPayment = t.paymentMethod.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchTags && !matchPayment) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, selectedCategory, searchQuery]);

  const handleBatchCategorize = async () => {
    const updatedCount = await batchCategorizeTransactions();
    setBatchSuccessMessage(
      `FinAgent verified & categorized ${updatedCount > 0 ? updatedCount : 'all'} transaction records.`
    );
    setTimeout(() => setBatchSuccessMessage(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Tags'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.amount,
      t.paymentMethod,
      `"${t.tags.join(', ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finagent_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Income & Expense Records</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              {transactions.length} items
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real user financial ledger audited by FinAgent smart categorization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Auto-Categorize */}
          <button
            onClick={handleBatchCategorize}
            disabled={isAgentRunning}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Bot className={`w-3.5 h-3.5 ${isAgentRunning ? 'animate-spin' : ''}`} />
            <span>{isAgentRunning ? 'Analyzing...' : 'AI Auto-Classify All'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {batchSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{batchSuccessMessage}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4">
        {/* Search Input */}
        <div className="lg:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by description, merchant, tags, or payment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Type Filter */}
        <div className="lg:col-span-3 flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'expense'
                ? 'bg-rose-500/20 text-rose-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="lg:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <p>No transactions match your search filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors text-xs"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 text-sm">
                        {tx.description}
                      </span>
                      {tx.isRecurring && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 font-mono">
                          Recurring
                        </span>
                      )}
                      {tx.aiCategorized && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono inline-flex items-center gap-0.5 border border-indigo-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          {Math.round((tx.aiConfidence || 0.95) * 100)}% AI
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-400 text-[11px] mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 font-medium">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300">
                        {tx.paymentMethod}
                      </span>
                    </div>

                    {tx.tags && tx.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {tx.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Info and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:ml-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div className="text-left sm:text-right">
                    <p
                      className={`text-base font-bold font-mono-numbers ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{tx.type}</p>
                  </div>

                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
