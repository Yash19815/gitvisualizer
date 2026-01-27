import { useState, useMemo } from "react";
import { useRepositoryStore } from "../../store/repositoryStore";

export function AuthorFilter() {
  const {
    contributorStats,
    selectedAuthors,
    setSelectedAuthors,
    isLoading,
    fetchStats,
  } = useRepositoryStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingAuthors, setPendingAuthors] = useState<string[]>([]);

  // Initialize pending authors when opening
  const handleToggle = () => {
    if (!isExpanded) {
      setPendingAuthors(selectedAuthors);
      // Fetch contributors if not loaded
      if (!contributorStats) {
        fetchStats();
      }
    }
    setIsExpanded(!isExpanded);
  };

  // Filter contributors by search query
  const filteredContributors = useMemo(() => {
    if (!contributorStats) return [];
    if (!searchQuery) return contributorStats;

    const query = searchQuery.toLowerCase();
    return contributorStats.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query),
    );
  }, [contributorStats, searchQuery]);

  const toggleAuthor = (email: string) => {
    setPendingAuthors((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleApply = () => {
    setSelectedAuthors(pendingAuthors);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setPendingAuthors([]);
    setSelectedAuthors([]);
    setIsExpanded(false);
  };

  const handleSelectAll = () => {
    if (contributorStats) {
      setPendingAuthors(contributorStats.map((c) => c.email));
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Author Filter</span>
          {selectedAuthors.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              {selectedAuthors.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {/* Search */}
          <input
            type="text"
            placeholder="Search authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Quick actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={() => setPendingAuthors([])}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Author list */}
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
            {!contributorStats ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-2 text-center">
                Loading authors...
              </div>
            ) : filteredContributors.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-2 text-center">
                No authors found
              </div>
            ) : (
              filteredContributors.map((contributor) => (
                <label
                  key={contributor.email}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={pendingAuthors.includes(contributor.email)}
                    onChange={() => toggleAuthor(contributor.email)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {contributor.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {contributor.email} ({contributor.commitCount} commits)
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Applying..." : "Apply Filter"}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
