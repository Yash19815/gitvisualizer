import { useEffect, useState } from "react";
import { useRepositoryStore } from "../../store/repositoryStore";
import { ContributorList } from "./ContributorList";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { CodeChurnList } from "./CodeChurnList";
import { BusFactorList } from "./BusFactorList";
import { CommitPatternHeatmap } from "./CommitPatternHeatmap";
import { BranchLifespanChart } from "./BranchLifespanChart";
import { cn } from "../../lib/utils";

type TabType =
  | "contributors"
  | "activity"
  | "churn"
  | "busfactor"
  | "patterns"
  | "branches";

const tabs: {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "contributors",
    label: "Contributors",
    description: "Team members and their contributions",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    description: "Commit activity over time",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: "churn",
    label: "Code Churn",
    description: "File change frequency",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
  {
    id: "busfactor",
    label: "Bus Factor",
    description: "Knowledge distribution risk",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  {
    id: "patterns",
    label: "Patterns",
    description: "Commit timing patterns",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "branches",
    label: "Branches",
    description: "Branch lifecycle analysis",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
];

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

  const [activeTab, setActiveTab] = useState<TabType>("contributors");

  // Fetch stats when panel opens
  useEffect(() => {
    if (showStatsPanel && !contributorStats && !isLoadingStats) {
      fetchStats();
    }
  }, [showStatsPanel, contributorStats, isLoadingStats, fetchStats]);

  // Fetch analytics data on tab switch
  useEffect(() => {
    if (!showStatsPanel) return;

    if (activeTab === "churn" && !codeChurn) {
      fetchCodeChurn();
    } else if (activeTab === "busfactor" && !busFactor) {
      fetchBusFactor();
    } else if (activeTab === "patterns" && !commitPatterns) {
      fetchCommitPatterns();
    } else if (activeTab === "branches" && !branchLifespans) {
      fetchBranchLifespans();
    }
  }, [
    activeTab,
    showStatsPanel,
    codeChurn,
    busFactor,
    commitPatterns,
    branchLifespans,
    fetchCodeChurn,
    fetchBusFactor,
    fetchCommitPatterns,
    fetchBranchLifespans,
  ]);

  if (!showStatsPanel) return null;

  const isLoading =
    isLoadingStats ||
    (activeTab === "churn" && !codeChurn) ||
    (activeTab === "busfactor" && !busFactor) ||
    (activeTab === "patterns" && !commitPatterns) ||
    (activeTab === "branches" && !branchLifespans);

  const activeTabInfo = tabs.find((t) => t.id === activeTab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && toggleStatsPanel()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[1100px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Repository Statistics
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Insights and analytics for your repository
                </p>
              </div>
            </div>
            <button
              onClick={toggleStatsPanel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-0 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150 whitespace-nowrap border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 border-transparent",
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <span
                  className={cn(
                    "transition-colors",
                    activeTab === tab.id
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                >
                  {tab.icon}
                </span>
                {tab.label}
                {tab.id === "contributors" && contributorStats && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full font-medium",
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {contributorStats.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Description */}
        {activeTabInfo && (
          <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTabInfo.description}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loading statistics
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Analyzing repository data...
                </p>
              </div>
            </div>
          ) : statsError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="w-8 h-8 text-red-500 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Failed to load statistics
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 max-w-xs">
                  {statsError}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {activeTab === "contributors" && contributorStats && (
                <ContributorList contributors={contributorStats} />
              )}
              {activeTab === "activity" && activityHeatmap && (
                <ActivityHeatmap activity={activityHeatmap} />
              )}
              {activeTab === "churn" && codeChurn && (
                <CodeChurnList data={codeChurn} />
              )}
              {activeTab === "busfactor" && busFactor && (
                <BusFactorList data={busFactor} />
              )}
              {activeTab === "patterns" && commitPatterns && (
                <CommitPatternHeatmap data={commitPatterns} />
              )}
              {activeTab === "branches" && branchLifespans && (
                <BranchLifespanChart data={branchLifespans} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
