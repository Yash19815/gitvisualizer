import { useState } from 'react';
import { useRepositoryStore } from '../../store/repositoryStore';

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last year', days: 365 },
];

export function DateRangeFilter() {
  const { dateFilter, setDateFilter, applyDateFilter, isLoading } = useRepositoryStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [customSince, setCustomSince] = useState('');
  const [customUntil, setCustomUntil] = useState('');

  const handlePresetClick = (days: number) => {
    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - days);

    setDateFilter({
      since: since.toISOString(),
      until: until.toISOString(),
    });
  };

  const handleCustomApply = () => {
    const newFilter: { since?: string; until?: string } = {};
    if (customSince) {
      newFilter.since = new Date(customSince).toISOString();
    }
    if (customUntil) {
      newFilter.until = new Date(customUntil + 'T23:59:59').toISOString();
    }
    setDateFilter(Object.keys(newFilter).length > 0 ? newFilter : null);
  };

  const handleClear = () => {
    setDateFilter(null);
    setCustomSince('');
    setCustomUntil('');
  };

  const handleApply = () => {
    applyDateFilter();
  };

  const formatDateForDisplay = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  const hasFilter = dateFilter && (dateFilter.since || dateFilter.until);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Date Filter
          {hasFilter && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-[10px] normal-case font-normal">
              Active
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => handlePresetClick(preset.days)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 w-12">From:</label>
              <input
                type="date"
                value={customSince}
                onChange={(e) => setCustomSince(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 w-12">To:</label>
              <input
                type="date"
                value={customUntil}
                onChange={(e) => setCustomUntil(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {(customSince || customUntil) && (
              <button
                onClick={handleCustomApply}
                className="w-full px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Set Custom Range
              </button>
            )}
          </div>

          {/* Current filter display */}
          {hasFilter && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {dateFilter.since && `From: ${formatDateForDisplay(dateFilter.since)}`}
                {dateFilter.since && dateFilter.until && ' — '}
                {dateFilter.until && `To: ${formatDateForDisplay(dateFilter.until)}`}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {hasFilter && (
              <button
                onClick={handleClear}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Loading...' : 'Apply Filter'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
