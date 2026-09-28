import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseTrendChartProps {
  transactions: Transaction[];
  currency: string;
}

export const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({
  transactions,
  currency,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    expense: number;
    income: number;
  } | null>(null);

  // Group transactions by date for the last 14-30 days
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; expense: number; income: number }>();

    // Sort transactions by date ascending
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Pick distinct dates (up to last 10 unique dates or evenly distributed)
    for (const t of sorted) {
      const entry = map.get(t.date) || { date: t.date, expense: 0, income: 0 };
      if (t.type === 'expense') {
        entry.expense += Number(t.amount || 0);
      } else {
        entry.income += Number(t.amount || 0);
      }
      map.set(t.date, entry);
    }

    return Array.from(map.values()).slice(-10);
  }, [transactions]);

  const maxVal = useMemo(() => {
    let max = 100;
    for (const d of dailyData) {
      if (d.expense > max) max = d.expense;
      if (d.income > max) max = d.income;
    }
    return max * 1.15; // with padding
  }, [dailyData]);

  if (dailyData.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
        No recent transaction timeline available
      </div>
    );
  }

  const height = 180;

  return (
    <div className="w-full">
      {/* Tooltip bar or header */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-400">Expenses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-400">Income</span>
          </div>
        </div>

        {hoveredDay ? (
          <div className="text-slate-200 font-mono-numbers bg-slate-800/90 border border-slate-700 px-2.5 py-0.5 rounded-md text-[11px] animate-fade-in">
            <span className="text-slate-400 mr-2">{hoveredDay.date}:</span>
            <span className="text-rose-400 mr-2">-{formatCurrency(hoveredDay.expense, currency)}</span>
            {hoveredDay.income > 0 && (
              <span className="text-emerald-400">+{formatCurrency(hoveredDay.income, currency)}</span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">Hover over bars for daily breakdown</span>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 pb-2 border-b border-slate-800/80">
        {dailyData.map((d) => {
          const expenseHeight = Math.max(6, (d.expense / maxVal) * height);
          const incomeHeight = d.income > 0 ? Math.max(6, (d.income / maxVal) * height) : 0;
          const isHovered = hoveredDay?.date === d.date;

          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="flex items-end justify-center gap-1 w-full max-w-[36px]">
                {/* Income Bar (if any on this day) */}
                {d.income > 0 && (
                  <div
                    style={{ height: `${incomeHeight}px` }}
                    className={`w-2.5 rounded-t transition-all duration-200 ${
                      isHovered ? 'bg-emerald-400 brightness-110' : 'bg-emerald-500/80'
                    }`}
                  />
                )}
                {/* Expense Bar */}
                <div
                  style={{ height: `${expenseHeight}px` }}
                  className={`w-3.5 rounded-t transition-all duration-200 ${
                    isHovered ? 'bg-rose-400 shadow-lg shadow-rose-900/50' : 'bg-rose-500/80'
                  }`}
                />
              </div>

              {/* Date label */}
              <span className="text-[10px] text-slate-400 mt-2 font-mono-numbers transform -rotate-25 md:rotate-0 truncate max-w-full">
                {d.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
