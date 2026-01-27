import { useRepositoryStore, type LoadMode } from "../../store/repositoryStore";

export function LargeRepoWarning() {
  const {
    showLargeRepoWarning,
    repoStats,
    dismissLargeRepoWarning,
    confirmLoadLargeRepo,
  } = useRepositoryStore();

  if (!showLargeRepoWarning || !repoStats) {
    return null;
  }

  const formatNumber = (n: number) => n.toLocaleString();

  const handleLoadMode = (mode: LoadMode) => {
    confirmLoadLargeRepo(mode);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-100 dark:border-amber-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
              <svg
                className="w-6 h-6 text-amber-600 dark:text-amber-400"
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Large Repository Detected
              </h2>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {formatNumber(repoStats.totalCommits)} commits found
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This repository has a large number of commits. Loading all commits
            may be slow and use significant memory. Choose how you'd like to
            proceed:
          </p>

          <div className="space-y-3">
            {/* Simplified Mode - Recommended for huge repos */}
            <button
              onClick={() => handleLoadMode("simplified")}
              className="w-full text-left p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    Simplified View
                    <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Shows only the main branch history (first-parent). Much
                    faster for complex histories with many merges.
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </button>

            {/* Paginated Mode */}
            <button
              onClick={() => handleLoadMode("paginated")}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Stream All Commits
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Loads all commits progressively. Shows complete history but
                    may take longer.
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </button>

            {/* Full Mode - Warning */}
            {repoStats.totalCommits < 100000 && (
              <button
                onClick={() => handleLoadMode("full")}
                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      Load Everything
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Slow
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Loads all commits at once. May freeze the browser for very
                      large repos.
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 flex justify-end">
          <button
            onClick={dismissLargeRepoWarning}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
