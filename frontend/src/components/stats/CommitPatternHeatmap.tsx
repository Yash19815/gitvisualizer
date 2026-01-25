import { useMemo, useState } from 'react';
import type { CommitPatterns } from '../../types';

interface CommitPatternHeatmapProps {
  data: CommitPatterns;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CommitPatternHeatmap({ data }: CommitPatternHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { matrix, maxCount } = useMemo(() => {
    const matrix = new Map<string, number>();
    let max = 0;

    for (const cell of data.hourlyDistribution) {
      const key = `${cell.dayOfWeek}-${cell.hour}`;
      matrix.set(key, cell.count);
      max = Math.max(max, cell.count);
    }

    return { matrix, maxCount: max };
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-green-200 dark:bg-green-900';
    if (intensity < 0.5) return 'bg-green-400 dark:bg-green-700';
    if (intensity < 0.75) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-700 dark:bg-green-500';
  };

  const handleMouseEnter = (e: React.MouseEvent, day: number, hour: number, count: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text: `${DAYS[day]} ${hour}:00 - ${count} commits`,
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  // Calculate weekday vs weekend
  const weekdayCommits = useMemo(() => {
    let weekday = 0;
    let weekend = 0;
    for (const cell of data.hourlyDistribution) {
      if (cell.dayOfWeek === 0 || cell.dayOfWeek === 6) {
        weekend += cell.count;
      } else {
        weekday += cell.count;
      }
    }
    return { weekday, weekend };
  }, [data]);

  return (
    <div>
      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.totalCommits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Commits</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatHour(data.peakHour)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Peak Hour</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {DAYS[data.peakDay]}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Peak Day</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {weekdayCommits.weekday > 0
              ? ((weekdayCommits.weekday / (weekdayCommits.weekday + weekdayCommits.weekend)) * 100).toFixed(0)
              : 0}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Weekday Commits</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative">
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2">
            <div className="h-5" /> {/* Header spacer */}
            {DAYS.map((day) => (
              <div key={day} className="h-5 flex items-center text-xs text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div>
            {/* Hour labels */}
            <div className="flex mb-1">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="w-5 text-center text-[10px] text-gray-400 dark:text-gray-500"
                >
                  {hour % 3 === 0 ? formatHour(hour).replace('am', '').replace('pm', '') : ''}
                </div>
              ))}
            </div>

            {/* Grid cells */}
            {DAYS.map((_, dayIndex) => (
              <div key={dayIndex} className="flex">
                {HOURS.map((hour) => {
                  const count = matrix.get(`${dayIndex}-${hour}`) || 0;
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`w-5 h-5 m-[1px] rounded-sm ${getColor(count)} cursor-pointer transition-transform hover:scale-110`}
                      onMouseEnter={(e) => handleMouseEnter(e, dayIndex, hour, count)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-end text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-4 h-4 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-4 h-4 rounded-sm bg-green-500 dark:bg-green-600" />
          <div className="w-4 h-4 rounded-sm bg-green-700 dark:bg-green-500" />
          <span>More</span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
