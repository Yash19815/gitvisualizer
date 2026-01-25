import { useRepositoryStore } from '../../store/repositoryStore';
import { getBranchColor } from '../../utils/branchColors';
import { SubmoduleList } from './SubmoduleList';

export function BranchList() {
  const { repository, searchQuery, setSearchQuery, loadMoreCommits, isLoading, loadMode, submodules } =
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
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Repository Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 text-sm">{repository.name}</h3>
        <p className="text-xs text-gray-500 mt-1 truncate" title={repository.path}>
          {repository.path}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
          <span>
            {repository.commits.length.toLocaleString()}
            {repository.totalCommitCount && repository.totalCommitCount > repository.commits.length
              ? ` / ${repository.totalCommitCount.toLocaleString()}`
              : ''}{' '}
            commits
          </span>
          <span>{localBranches.length} branches</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
          <span>{repository.tags.length} tags</span>
          {loadMode !== 'full' && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
              {loadMode === 'simplified' ? 'Simplified' : 'Streaming'}
            </span>
          )}
        </div>
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
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Current Branch</h4>
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: getBranchColor(0) }}
          />
          <span className="text-sm font-medium text-blue-900">{repository.currentBranch}</span>
        </div>
      </div>

      {/* Local Branches */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Local Branches ({localBranches.length})
        </h4>
        <div className="space-y-1">
          {localBranches.map((branch, index) => (
            <div
              key={branch.name}
              className={`
                flex items-center gap-2 p-2 rounded-lg text-sm
                ${branch.isHead ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'}
              `}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: getBranchColor(index) }}
              />
              <span className="truncate">{branch.name}</span>
              {branch.isHead && (
                <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">HEAD</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Remote Branches */}
      {remoteBranches.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Remote Branches ({remoteBranches.length})
          </h4>
          <div className="space-y-1">
            {remoteBranches.slice(0, 10).map((branch) => (
              <div
                key={branch.name}
                className="flex items-center gap-2 p-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="truncate">{branch.name}</span>
              </div>
            ))}
            {remoteBranches.length > 10 && (
              <p className="text-xs text-gray-400 pl-4">
                +{remoteBranches.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {repository.tags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Tags ({repository.tags.length})
          </h4>
          <div className="space-y-1">
            {repository.tags.slice(0, 10).map((tag) => (
              <div
                key={tag.name}
                className="flex items-center gap-2 p-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{tag.name}</span>
              </div>
            ))}
            {repository.tags.length > 10 && (
              <p className="text-xs text-gray-400 pl-4">
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
