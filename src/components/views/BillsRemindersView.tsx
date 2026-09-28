import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Check,
  Calendar,
  AlertCircle,
  Bell,
  Trash2,
  DollarSign,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { BillReminder } from '../../types/finance';
import { formatCurrency, getDaysRemainingUntil } from '../../utils/formatters';
import { DisclaimerBanner } from '../DisclaimerBanner';

export const BillsRemindersView: React.FC = () => {
  const { bills, addBill, toggleBillPaid, deleteBill, currency, mode } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState(mode === 'student' ? 'Housing' : 'Utilities & Internet');
  const [frequency, setFrequency] = useState<BillReminder['frequency']>('Monthly');
  const [autoReminder, setAutoReminder] = useState(true);

  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!title.trim() || !parsedAmt || parsedAmt <= 0 || !dueDate) return;

    addBill({
      title: title.trim(),
      amount: parsedAmt,
      dueDate,
      category,
      frequency,
      autoReminder,
    });

    setTitle('');
    setAmount('');
    setDueDate('');
    setShowAddModal(false);
  };

  const pendingBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-400" />
            <span>Bills & Payment Reminders</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss a hostel fee, utility bill, or credit card deadline
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill Reminder</span>
        </button>
      </div>

      {/* Pending Bills Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <span>Pending Obligations</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            {pendingBills.length} Due
          </span>
        </h3>

        {pendingBills.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
            🎉 All recorded bills for this cycle are paid!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBills.map((b) => {
              const days = getDaysRemainingUntil(b.dueDate);
              const isUrgent = days <= 3;

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl bg-slate-900/80 border flex flex-col justify-between transition-all text-xs ${
                    isUrgent
                      ? 'border-amber-700/60 shadow-md shadow-amber-950/20'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{b.title}</h4>
                        <span className="text-[11px] text-slate-400">{b.category}</span>
                      </div>
                      <button
                        onClick={() => deleteBill(b.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between font-mono-numbers my-3">
                      <span className="text-2xl font-bold text-slate-100">
                        {formatCurrency(b.amount, currency)}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {days === 0 ? 'Due Today' : `${days} days left`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Due: {b.dueDate}</span>
                      <span className="font-mono text-slate-300">{b.frequency}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {b.autoReminder ? '🔔 Reminder Active' : 'No reminder'}
                    </span>
                    <button
                      onClick={() => toggleBillPaid(b.id, true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Paid</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paid Bills Section */}
      {paidBills.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-400">Paid Bills History</h3>
          <div className="divide-y divide-slate-800/60 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden text-xs">
            {paidBills.map((b) => (
              <div
                key={b.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-300 line-through">{b.title}</p>
                    <p className="text-[11px] text-slate-500">{b.category} • {b.dueDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold font-mono-numbers text-slate-400">
                    {formatCurrency(b.amount, currency)}
                  </span>
                  <button
                    onClick={() => toggleBillPaid(b.id, false)}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Unmark
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm">Add Bill Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBillSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Bill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel Wi-Fi, PG Rent, PG&E Utility"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="55.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono-numbers outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoRem"
                  checked={autoReminder}
                  onChange={(e) => setAutoReminder(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                />
                <label htmlFor="autoRem" className="text-slate-300">
                  Notify me 7 days before due date
                </label>
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
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
