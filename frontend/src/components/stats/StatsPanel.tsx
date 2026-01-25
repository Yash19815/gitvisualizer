import { useEffect, useState } from 'react';
import { useRepositoryStore } from '../../store/repositoryStore';
import { ContributorList } from './ContributorList';
import { ActivityHeatmap } from './ActivityHeatmap';
import { CodeChurnList } from './CodeChurnList';
import { BusFactorList } from './BusFactorList';
import { CommitPatternHeatmap } from './CommitPatternHeatmap';
import { BranchLifespanChart } from './BranchLifespanChart';

type TabType = 'contributors' | 'activity' | 'churn' | 'busfactor' | 'patterns' | 'branches';

export function StatsPanel() {
  const {
    showStatsPanel,
    toggleStatsPanel,
    contributorStats,
    activityHeatmap,
    codeChurn,
    busFactor,
    commitPatterns,
    branchLifespans,
    isLoadingStats,
    statsError,
    fetchStats,
    fetchCodeChurn,
    fetchBusFactor,
    fetchCommitPatterns,
    fetchBranchLifespans,
  } = useRepositoryStore();

  const [activeTab, setActiveTab] = useState<TabType>('contributors');

  // Fetch stats when panel opens
  useEffect(() => {
    if (showStatsPanel && !contributorStats && !isLoadingStats) {
      fetchStats();
    }
  }, [showStatsPanel, contributorStats, isLoadingStats, fetchStats]);

  // Fetch analytics data on tab switch
  useEffect(() => {
    if (!showStatsPanel) return;

    if (activeTab === 'churn' && !codeChurn) {
      fetchCodeChurn();
    } else if (activeTab === 'busfactor' && !busFactor) {
      fetchBusFactor();
    } else if (activeTab === 'patterns' && !commitPatterns) {
      fetchCommitPatterns();
    } else if (activeTab === 'branches' && !branchLifespans) {
      fetchBranchLifespans();
    }
  }, [activeTab, showStatsPanel, codeChurn, busFactor, commitPatterns, branchLifespans, fetchCodeChurn, fetchBusFactor, fetchCommitPatterns, fetchBranchLifespans]);

  if (!showStatsPanel) return null;

  const isLoading = isLoadingStats ||
    (activeTab === 'churn' && !codeChurn) ||
    (activeTab === 'busfactor' && !busFactor) ||
    (activeTab === 'patterns' && !commitPatterns) ||
    (activeTab === 'branches' && !branchLifespans);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[1000px] max-w-[95vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Repository Statistics</h2>
          <button
            onClick={toggleStatsPanel}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contributors'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('contributors')}
          >
            Contributors
            {contributorStats && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                {contributorStats.length}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'churn'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('churn')}
          >
            Code Churn
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'busfactor'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('busfactor')}
          >
            Bus Factor
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'patterns'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('patterns')}
          >
            Patterns
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'branches'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('branches')}
          >
            Branch Lifespan
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : statsError ? (
            <div className="flex flex-col items-center justify-center h-48 text-red-500 dark:text-red-400">
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
              {activeTab === 'churn' && codeChurn && (
                <CodeChurnList data={codeChurn} />
              )}
              {activeTab === 'busfactor' && busFactor && (
                <BusFactorList data={busFactor} />
              )}
              {activeTab === 'patterns' && commitPatterns && (
                <CommitPatternHeatmap data={commitPatterns} />
              )}
              {activeTab === 'branches' && branchLifespans && (
                <BranchLifespanChart data={branchLifespans} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
