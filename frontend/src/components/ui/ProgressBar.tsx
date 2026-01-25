import { useRepositoryStore } from '../../store/repositoryStore';

export function ProgressBar() {
  const { isLoading, loadingMessage, loadingProgress } = useRepositoryStore();

  if (!isLoading) return null;

  const isIndeterminate = loadingProgress < 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 overflow-hidden">
        {isIndeterminate ? (
          <div className="h-full bg-blue-500 animate-progress-indeterminate" />
        ) : (
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        )}
      </div>

      {/* Loading message overlay */}
      {loadingMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-3 border">
            <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-700">{loadingMessage}</span>
            {!isIndeterminate && (
              <span className="text-xs text-gray-400">{loadingProgress}%</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
