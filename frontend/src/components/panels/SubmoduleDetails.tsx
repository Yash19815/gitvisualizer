import { useRepositoryStore } from '../../store/repositoryStore';

export function SubmoduleDetails() {
  const {
    selectedSubmodule,
    setSelectedSubmodule,
    navigateToSubmodule,
    isLoadingSubmodule,
    submoduleError,
  } = useRepositoryStore();

  if (!selectedSubmodule) return null;

  const handleNavigate = () => {
    if (selectedSubmodule.initialized) {
      navigateToSubmodule(selectedSubmodule.path);
    }
  };

  const handleClose = () => {
    setSelectedSubmodule(null);
  };

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h2 className="font-semibold text-gray-900">Submodule</h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
          <p className="mt-1 text-sm font-medium text-gray-900">{selectedSubmodule.name}</p>
        </div>

        {/* Path */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Path</label>
          <p className="mt-1 text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
            {selectedSubmodule.path}
          </p>
        </div>

        {/* URL */}
        {selectedSubmodule.url && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remote URL</label>
            <p className="mt-1 text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded break-all">
              {selectedSubmodule.url}
            </p>
          </div>
        )}

        {/* Current Commit */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Commit</label>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {selectedSubmodule.currentCommit.substring(0, 7)}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(selectedSubmodule.currentCommit)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy full hash"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
          <div className="mt-1">
            {selectedSubmodule.initialized ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Initialized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Not Initialized
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {submoduleError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submoduleError}
          </div>
        )}

        {/* Not initialized warning */}
        {!selectedSubmodule.initialized && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p className="font-medium">Submodule not initialized</p>
            <p className="text-xs mt-1">
              Run the following command to initialize:
            </p>
            <code className="block mt-2 text-xs bg-yellow-100 p-2 rounded font-mono">
              git submodule update --init {selectedSubmodule.path}
            </code>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleNavigate}
          disabled={!selectedSubmodule.initialized || isLoadingSubmodule}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            font-medium text-sm transition-colors
            ${selectedSubmodule.initialized && !isLoadingSubmodule
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoadingSubmodule ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Navigate Into Submodule
            </>
          )}
        </button>
      </div>
    </div>
  );
}
