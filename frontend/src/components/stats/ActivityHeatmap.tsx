import { useMemo, useState } from 'react';
import type { ActivityDay } from '../../types';
import { cn } from '../../lib/utils';

interface ActivityHeatmapProps {
  activity: ActivityDay[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColorIntensity(count: number, maxCount: number): string {
  if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900';
  if (ratio <= 0.5) return 'bg-emerald-400 dark:bg-emerald-700';
  if (ratio <= 0.75) return 'bg-emerald-500 dark:bg-emerald-500';
  return 'bg-emerald-600 dark:bg-emerald-400';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const { weeks, maxCount, monthLabels, totalCommits, busiestDay, averagePerDay } = useMemo(() => {
    // Create a map of date -> count
    const activityMap = new Map<string, number>();
    activity.forEach((day) => {
      activityMap.set(day.date, day.count);
    });

    // Calculate date range (last 365 days)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Build weeks array
    const weeks: { date: string; count: number }[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let currentWeek: { date: string; count: number }[] = [];
    let currentMonth = -1;
    let total = 0;
    let maxCount = 0;
    let busiestDay = { date: '', count: 0 };
    let daysWithActivity = 0;

    const currentDate = new Date(startDate);
    let weekIndex = 0;

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      total += count;
      if (count > 0) daysWithActivity++;
      if (count > maxCount) {
        maxCount = count;
        busiestDay = { date: dateStr, count };
      }

      // Track month changes for labels
      if (currentDate.getMonth() !== currentMonth && currentWeek.length === 0) {
        monthLabels.push({ month: MONTHS[currentDate.getMonth()], weekIndex });
        currentMonth = currentDate.getMonth();
      }

      currentWeek.push({ date: dateStr, count });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const averagePerDay = daysWithActivity > 0 ? (total / daysWithActivity).toFixed(1) : '0';

    return { weeks, maxCount: maxCount || 1, monthLabels, totalCommits: total, busiestDay, averagePerDay };
  }, [activity]);

  const handleMouseEnter = (day: { date: string; count: number }, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      date: day.date,
      count: day.count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCommits.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Commits this year</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{averagePerDay}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg commits / active day</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{busiestDay.count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Best day record</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        {/* Month labels */}
        <div className="relative h-5 ml-8 mb-2">
          {monthLabels.map((label, idx) => (
            <div
              key={idx}
              className="absolute text-xs font-medium text-gray-500 dark:text-gray-400"
              style={{
                left: `${label.weekIndex * 14}px`,
              }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-2 text-xs text-gray-400 dark:text-gray-500">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className="h-[12px] flex items-center justify-end pr-1"
                style={{ visibility: idx % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[3px] overflow-x-auto pb-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "w-[12px] h-[12px] rounded-[3px] cursor-pointer transition-all duration-150",
                      getColorIntensity(day.count, maxCount),
                      "hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 hover:ring-offset-1 dark:hover:ring-offset-gray-800"
                    )}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[12px] h-[12px] rounded-[3px] bg-gray-100 dark:bg-gray-800" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-emerald-400 dark:bg-emerald-700" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-emerald-500 dark:bg-emerald-500" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl pointer-events-none border border-gray-700 dark:border-gray-600"
          style={{
            left: tooltip.x,
            top: tooltip.y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{tooltip.count} {tooltip.count === 1 ? 'commit' : 'commits'}</div>
          <div className="text-gray-400 dark:text-gray-300 mt-0.5">{formatDate(tooltip.date)}</div>
        </div>
      )}
    </div>
  );
}
