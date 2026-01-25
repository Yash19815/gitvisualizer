import { useEffect, useState } from 'react';
import { useRepositoryStore } from '../../store/repositoryStore';
import { ContributorList } from './ContributorList';
import { ActivityHeatmap } from './ActivityHeatmap';

type TabType = 'contributors' | 'activity';

export function StatsPanel() {
  const {
    showStatsPanel,
    toggleStatsPanel,
    contributorStats,
    activityHeatmap,
    isLoadingStats,
    statsError,
    fetchStats,
  } = useRepositoryStore();

  const [activeTab, setActiveTab] = useState<TabType>('contributors');

  // Fetch stats when panel opens
  useEffect(() => {
    if (showStatsPanel && !contributorStats && !isLoadingStats) {
      fetchStats();
    }
  }, [showStatsPanel, contributorStats, isLoadingStats, fetchStats]);

  if (!showStatsPanel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-w-[90vw] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Repository Statistics</h2>
          <button
            onClick={toggleStatsPanel}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contributors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('contributors')}
          >
            Contributors
            {contributorStats && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full">
                {contributorStats.length}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoadingStats ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-500">Loading statistics...</span>
            </div>
          ) : statsError ? (
            <div className="flex flex-col items-center justify-center h-48 text-red-500">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>{statsError}</div>
            </div>
          ) : (
            <>
              {activeTab === 'contributors' && contributorStats && (
                <ContributorList contributors={contributorStats} />
              )}
              {activeTab === 'activity' && activityHeatmap && (
                <ActivityHeatmap activity={activityHeatmap} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
