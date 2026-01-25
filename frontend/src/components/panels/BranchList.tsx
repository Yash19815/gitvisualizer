import { useRepositoryStore } from '../../store/repositoryStore';
import { getBranchColor } from '../../utils/branchColors';
import { SubmoduleList } from './SubmoduleList';
import { DateRangeFilter } from '../filters/DateRangeFilter';
import { AuthorFilter } from '../filters/AuthorFilter';

export function BranchList() {
  const { repository, searchQuery, setSearchQuery, loadMoreCommits, isLoading, loadMode, submodules, selectedBranchFilter, setSelectedBranchFilter, selectedTagFilter, setSelectedTagFilter } =
    useRepositoryStore();

  if (!repository) {
    return null;
  }

  const localBranches = repository.branches.filter((b) => !b.isRemote);
  const remoteBranches = repository.branches.filter((b) => b.isRemote);

  const hasMoreCommits =
    repository.totalCommitCount &&
    repository.loadedCommitCount &&
    repository.loadedCommitCount < repository.totalCommitCount;

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commits..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter />

      {/* Author Filter */}
      <AuthorFilter />

      {/* Repository Info */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{repository.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={repository.path}>
          {repository.path}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>
            {repository.commits.length.toLocaleString()}
            {repository.totalCommitCount && repository.totalCommitCount > repository.commits.length
              ? ` / ${repository.totalCommitCount.toLocaleString()}`
              : ''}{' '}
            commits
          </span>
          <span>{localBranches.length} branches</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
          <span>{repository.tags.length} tags</span>
          {loadMode !== 'full' && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px]">
              {loadMode === 'simplified' ? 'Simplified' : 'Streaming'}
            </span>
          )}
        </div>
        {(selectedBranchFilter || selectedTagFilter) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-gray-500">Filtered:</span>
            {selectedBranchFilter && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium truncate max-w-[150px]" title={selectedBranchFilter}>
                {selectedBranchFilter}
              </span>
            )}
            {selectedTagFilter && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium truncate max-w-[150px]" title={selectedTagFilter}>
                {selectedTagFilter}
              </span>
            )}
            <button
              onClick={() => {
                if (selectedBranchFilter) setSelectedBranchFilter(null);
                if (selectedTagFilter) setSelectedTagFilter(null);
              }}
              className="text-gray-400 hover:text-gray-600"
              title="Clear filter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {hasMoreCommits && (
          <button
            onClick={loadMoreCommits}
            disabled={isLoading}
            className="mt-2 w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load More Commits'}
          </button>
        )}
      </div>

      {/* Current Branch */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Current Branch</h4>
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: getBranchColor(0) }}
          />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{repository.currentBranch}</span>
        </div>
      </div>

      {/* Local Branches */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Local Branches ({localBranches.length})
          </h4>
          {(selectedBranchFilter || selectedTagFilter) && (
            <button
              onClick={() => {
                if (selectedBranchFilter) setSelectedBranchFilter(null);
                if (selectedTagFilter) setSelectedTagFilter(null);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Show All
            </button>
          )}
        </div>
        <div className="space-y-1">
          {localBranches.map((branch, index) => {
            const isSelected = selectedBranchFilter === branch.name;
            return (
              <button
                key={branch.name}
                onClick={() => setSelectedBranchFilter(isSelected ? null : branch.name)}
                disabled={isLoading}
                className={`
                  w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors
                  ${isSelected
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500'
                    : branch.isHead
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: getBranchColor(index) }}
                />
                <span className="truncate flex-1">{branch.name}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                )}
                {branch.isHead && !isSelected && (
                  <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">HEAD</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Remote Branches */}
      {remoteBranches.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Remote Branches ({remoteBranches.length})
          </h4>
          <div className="space-y-1">
            {remoteBranches.slice(0, 10).map((branch) => {
              const isSelected = selectedBranchFilter === branch.name;
              return (
                <button
                  key={branch.name}
                  onClick={() => setSelectedBranchFilter(isSelected ? null : branch.name)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors
                    ${isSelected
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                  <span className="truncate flex-1">{branch.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  )}
                </button>
              );
            })}
            {remoteBranches.length > 10 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pl-4">
                +{remoteBranches.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {repository.tags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Tags ({repository.tags.length})
          </h4>
          <div className="space-y-1">
            {repository.tags.slice(0, 10).map((tag) => {
              const isSelected = selectedTagFilter === tag.name;
              return (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTagFilter(isSelected ? null : tag.name)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors
                    ${isSelected
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 ring-2 ring-green-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <svg className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate flex-1">{tag.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  )}
                </button>
              );
            })}
            {repository.tags.length > 10 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pl-4">
                +{repository.tags.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Submodules */}
      {submodules && submodules.length > 0 && (
        <SubmoduleList submodules={submodules} />
      )}
    </div>
  );
}
