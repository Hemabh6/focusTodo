import React from 'react';

/** Returns the last `n` days as 'YYYY-MM-DD' strings, oldest first. */
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

const INTENSITY = [
  'bg-slate-100',    // 0 completions
  'bg-emerald-200',  // low
  'bg-emerald-400',  // medium
  'bg-emerald-600',  // high
];

/**
 * A 28-day (4-week) GitHub-style heatmap showing total habit completions per day.
 *
 * Props:
 *   tasks — the full tasks array from useTasks (needs type==='habit' and completed===true)
 */
export default function HabitHeatmap({ tasks }) {
  const days = lastNDays(28);
  const daySet = new Set(days);

  // Count completions per day across ALL habits
  const countByDate = {};
  tasks
    .filter((t) => t.type === 'habit' && t.completed)
    .forEach((t) => {
      const date = (t.completedAt || t.createdAt)?.split('T')[0];
      if (date && daySet.has(date)) countByDate[date] = (countByDate[date] || 0) + 1;
    });

  const maxCount = Math.max(...Object.values(countByDate), 1);

  const getColor = (count) => {
    if (!count) return INTENSITY[0];
    const ratio = count / maxCount;
    if (ratio < 0.34) return INTENSITY[1];
    if (ratio < 0.67) return INTENSITY[2];
    return INTENSITY[3];
  };

  const total = Object.values(countByDate).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          28-Day Activity
        </span>
        <span className="text-xs font-bold text-emerald-600">
          {total} habit{total !== 1 ? 's' : ''} completed
        </span>
      </div>

      {/* 7 columns × 4 rows grid (newest day bottom-right) */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => (
          <div
            key={date}
            title={`${date}: ${countByDate[date] || 0}`}
            className={`h-4 rounded-sm ${getColor(countByDate[date] || 0)}`}
          />
        ))}
      </div>

      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
        <span>4 weeks ago</span>
        <span>today</span>
      </div>
    </div>
  );
}
