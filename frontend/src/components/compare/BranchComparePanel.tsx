import { useEffect } from "react";
import { useRepositoryStore } from "../../store/repositoryStore";
import type { FileDiff, Commit } from "../../types";

function FileStatusBadge({ status }: { status: FileDiff["status"] }) {
  const colors = {
    added: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    deleted: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    modified:
      "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    renamed: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    copied:
      "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  };

  const labels = {
    added: "A",
    deleted: "D",
    modified: "M",
    renamed: "R",
    copied: "C",
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function CommitItem({ commit }: { commit: Commit }) {
  return (
    <div className="py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {commit.shortHash}
        </span>
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">
          {commit.message}
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {commit.author.name} • {new Date(commit.date).toLocaleDateString()}
      </div>
    </div>
  );
}

export function BranchComparePanel() {
  const {
    showBranchComparePanel,
    toggleBranchComparePanel,
    repository,
    compareBaseBranch,
    compareTargetBranch,
    setCompareBranches,
    branchComparison,
    isLoadingComparison,
    comparisonError,
    fetchBranchComparison,
  } = useRepositoryStore();

  useEffect(() => {
    if (
      showBranchComparePanel &&
      compareBaseBranch &&
      compareTargetBranch &&
      !branchComparison
    ) {
      fetchBranchComparison();
    }
  }, [showBranchComparePanel, compareBaseBranch, compareTargetBranch]);

  if (!showBranchComparePanel || !repository) return null;

  const allBranches = repository.branches.map((b) => b.name);

  const handleSwapBranches = () => {
    setCompareBranches(compareTargetBranch, compareBaseBranch);
  };

  const handleCompare = () => {
    fetchBranchComparison();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Branch Comparison
          </h2>
          <button
            onClick={toggleBranchComparePanel}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

        {/* Branch Selectors */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Base Branch
              </label>
              <select
                value={compareBaseBranch || ""}
                onChange={(e) =>
                  setCompareBranches(e.target.value, compareTargetBranch)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapBranches}
              className="mt-5 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Swap branches"
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Compare Branch
              </label>
              <select
                value={compareTargetBranch || ""}
                onChange={(e) =>
                  setCompareBranches(compareBaseBranch, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={
                isLoadingComparison ||
                !compareBaseBranch ||
                !compareTargetBranch
              }
              className="mt-5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingComparison ? "Comparing..." : "Compare"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingComparison && (
            <div className="flex items-center justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}

          {comparisonError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm">
              {comparisonError}
            </div>
          )}

          {branchComparison && !isLoadingComparison && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
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
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span className="font-semibold">
                      {branchComparison.aheadCount} ahead
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Commits in {branchComparison.compareBranch} not in{" "}
                    {branchComparison.baseBranch}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
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
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span className="font-semibold">
                      {branchComparison.behindCount} behind
                    </span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Commits in {branchComparison.baseBranch} not in{" "}
                    {branchComparison.compareBranch}
                  </p>
                </div>
              </div>

              {/* File Changes Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  File Changes
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {branchComparison.files.length} files changed
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    +{branchComparison.totalAdditions}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{branchComparison.totalDeletions}
                  </span>
                </div>
              </div>

              {/* Commits Ahead */}
              {branchComparison.aheadCommits.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Commits ahead ({branchComparison.aheadCount})
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
                    {branchComparison.aheadCommits
                      .slice(0, 20)
                      .map((commit) => (
                        <CommitItem key={commit.hash} commit={commit} />
                      ))}
                    {branchComparison.aheadCommits.length > 20 && (
                      <div className="py-2 px-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{branchComparison.aheadCommits.length - 20} more
                        commits
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commits Behind */}
              {branchComparison.behindCommits.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Commits behind ({branchComparison.behindCount})
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
                    {branchComparison.behindCommits
                      .slice(0, 20)
                      .map((commit) => (
                        <CommitItem key={commit.hash} commit={commit} />
                      ))}
                    {branchComparison.behindCommits.length > 20 && (
                      <div className="py-2 px-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{branchComparison.behindCommits.length - 20} more
                        commits
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Changed Files */}
              {branchComparison.files.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Changed Files ({branchComparison.files.length})
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    {branchComparison.files.map((file) => (
                      <div
                        key={file.path}
                        className="py-2 px-3 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <FileStatusBadge status={file.status} />
                        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate font-mono">
                          {file.path}
                        </span>
                        {!file.binary && (
                          <span className="text-xs">
                            <span className="text-green-600 dark:text-green-400">
                              +{file.additions}
                            </span>
                            {" / "}
                            <span className="text-red-600 dark:text-red-400">
                              -{file.deletions}
                            </span>
                          </span>
                        )}
                        {file.binary && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            binary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No differences */}
              {branchComparison.aheadCount === 0 &&
                branchComparison.behindCount === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>These branches are identical</p>
                  </div>
                )}
            </div>
          )}

          {!branchComparison && !isLoadingComparison && !comparisonError && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
              <p>Select branches and click Compare to see differences</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
