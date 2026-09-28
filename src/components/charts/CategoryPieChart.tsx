import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface CategoryPieChartProps {
  categories: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
    count: number;
  }[];
  totalExpense: number;
  currency: string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categories,
  totalExpense,
  currency,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (categories.length === 0 || totalExpense === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-2">
          <span>0%</span>
        </div>
        No expense data recorded this month
      </div>
    );
  }

  // Pre-calculate SVG donut slices
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  const slices = categories.map((cat, index) => {
    const fraction = cat.amount / totalExpense;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...cat,
      index,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeCategory = hoveredIndex !== null ? categories[hoveredIndex] : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <circle
                key={slice.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {activeCategory ? activeCategory.category : 'Total Spent'}
          </span>
          <span className="text-xl font-bold font-mono-numbers text-slate-100 mt-0.5">
            {formatCurrency(activeCategory ? activeCategory.amount : totalExpense, currency)}
          </span>
          <span className="text-xs text-indigo-400 font-semibold mt-0.5">
            {activeCategory ? `${activeCategory.percentage}% of total` : `${categories.length} categories`}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full max-h-56 overflow-y-auto pr-1 space-y-2">
        {categories.slice(0, 7).map((cat, i) => (
          <div
            key={cat.category}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
              hoveredIndex === i
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-slate-900/40 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-slate-200 font-medium truncate">{cat.category}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span className="text-slate-400 font-mono-numbers">{cat.percentage}%</span>
              <span className="text-slate-200 font-semibold font-mono-numbers">
                {formatCurrency(cat.amount, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
