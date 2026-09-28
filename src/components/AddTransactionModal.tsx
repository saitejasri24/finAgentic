import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Tag,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Bot,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { PaymentMethod } from '../types/finance';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Cash',
  'Apple Pay / GPay',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addTransaction, aiCategorizeTransaction, mode, currency, budgets } = useFinance();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    confidence: number;
    explanation: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAiCategorize = async () => {
    if (!description.trim()) return;
    setIsAiLoading(true);
    setAiResult(null);

    try {
      const res = await aiCategorizeTransaction(
        description,
        parseFloat(amount) || 0,
        paymentMethod
      );
      setCategory(res.category);
      if (res.tags && res.tags.length > 0) {
        setTagsInput(res.tags.join(', '));
      }
      setIsRecurring(res.isRecurring);
      setAiResult({
        confidence: Math.round(res.confidence * 100),
        explanation: res.explanation,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!description.trim()) return;

    const finalCategory =
      category.trim() ||
      (type === 'income'
        ? mode === 'student'
          ? 'Pocket Money'
          : 'Monthly Salary'
        : mode === 'student'
        ? 'Mess & Food'
        : 'Groceries & Supplies');

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    await addTransaction({
      type,
      amount: parsedAmount,
      date,
      category: finalCategory,
      description: description.trim(),
      paymentMethod,
      tags: tagsArray,
      isRecurring,
      aiCategorized: Boolean(aiResult),
      aiConfidence: aiResult ? aiResult.confidence / 100 : undefined,
    });

    // Reset and close
    setAmount('');
    setDescription('');
    setCategory('');
    setTagsInput('');
    setAiResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Add New Transaction</h2>
              <p className="text-[11px] text-slate-400">
                FinAgent automatically infers tags and categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Type Selector (Expense vs Income) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Amount ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono-numbers">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-100 font-mono-numbers text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Date *</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description with instant AI categorize trigger */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400 font-medium">
                Description / Merchant *
              </label>
              <button
                type="button"
                onClick={handleAiCategorize}
                disabled={!description.trim() || isAiLoading}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Bot className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Analyzing...' : 'AI Auto-Classify'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={
                mode === 'student'
                  ? 'e.g., Campus night canteen pizza, Subway monthly pass, Math tutor stipend'
                  : 'e.g., Whole Foods grocery run, Shell EV charging, TechCorp salary'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description.trim() && !category) {
                  handleAiCategorize();
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* AI Banner Prediction if ready */}
          {aiResult && (
            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-start justify-between gap-2 animate-fade-in text-[11px]">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-indigo-200">
                      FinAgent Prediction: {category}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                      {aiResult.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5">{aiResult.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Category Dropdown and Override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <input
                type="text"
                list="category-suggestions"
                placeholder="Select or type category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
              />
              <datalist id="category-suggestions">
                {budgets.map((b) => (
                  <option key={b.id} value={b.category} />
                ))}
                {mode === 'student' ? (
                  <>
                    <option value="Pocket Money" />
                    <option value="Part-time Tutoring" />
                    <option value="Hostel & Room Rent" />
                    <option value="Mess & Food" />
                    <option value="Books & Campus Prints" />
                    <option value="Travel & Metro" />
                    <option value="Hangouts & Snacks" />
                    <option value="Mobile & Subscriptions" />
                  </>
                ) : (
                  <>
                    <option value="Monthly Salary" />
                    <option value="Freelance & Consulting" />
                    <option value="Rent & Housing" />
                    <option value="Groceries & Supplies" />
                    <option value="Dining & Cafes" />
                    <option value="Utilities & Internet" />
                    <option value="Transportation & Fuel" />
                    <option value="Entertainment & Leisure" />
                  </>
                )}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags and Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">
                Tags (comma separated)
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. food, boba, campus, treat"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="isRecurring" className="text-slate-300 font-medium cursor-pointer">
                Recurring cycle
              </label>
            </div>
          </div>

          {/* Submit and Cancel */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
