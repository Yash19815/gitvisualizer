import { useMemo, useState } from 'react';
import type { ActivityDay } from '../../types';

interface ActivityHeatmapProps {
  activity: ActivityDay[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColorIntensity(count: number, maxCount: number): string {
  if (count === 0) return 'bg-gray-100';
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 'bg-green-200';
  if (ratio <= 0.5) return 'bg-green-400';
  if (ratio <= 0.75) return 'bg-green-500';
  return 'bg-green-700';
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

  const { weeks, maxCount, monthLabels, totalCommits } = useMemo(() => {
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

    const currentDate = new Date(startDate);
    let weekIndex = 0;

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      total += count;
      maxCount = Math.max(maxCount, count);

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

    return { weeks, maxCount: maxCount || 1, monthLabels, totalCommits: total };
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
    <div className="p-4">
      {/* Summary */}
      <div className="mb-4 text-sm text-gray-600">
        <span className="font-medium text-gray-800">{totalCommits.toLocaleString()}</span> commits in the last year
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map((label, idx) => (
          <div
            key={idx}
            className="text-xs text-gray-500"
            style={{
              position: 'absolute',
              left: `${label.weekIndex * 12 + 32}px`,
            }}
          >
            {label.month}
          </div>
        ))}
      </div>

      <div className="flex mt-4">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-2 text-xs text-gray-500">
          {DAYS_OF_WEEK.map((day, idx) => (
            <div
              key={day}
              className="h-[10px] flex items-center"
              style={{ visibility: idx % 2 === 1 ? 'visible' : 'hidden' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[2px] overflow-x-auto">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[2px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-[10px] h-[10px] rounded-sm cursor-pointer ${getColorIntensity(day.count, maxCount)} hover:ring-1 hover:ring-gray-400`}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-[10px] h-[10px] rounded-sm bg-gray-100" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-200" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-400" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-700" />
        </div>
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 30,
            transform: 'translateX(-50%)',
          }}
        >
          <strong>{tooltip.count} {tooltip.count === 1 ? 'commit' : 'commits'}</strong> on {formatDate(tooltip.date)}
        </div>
      )}
    </div>
  );
}
