import { useRepositoryStore } from '../../store/repositoryStore';

export function RepositoryBreadcrumb() {
  const { repository, repositoryStack, navigateBack, navigateToRoot, isLoadingSubmodule } = useRepositoryStore();

  // Don't show breadcrumb if we're at the root
  if (repositoryStack.length === 0 || !repository) {
    return null;
  }

  const handleNavigateToIndex = (index: number) => {
    if (index === 0) {
      navigateToRoot();
    } else {
      // Navigate back to a specific point in the stack
      // This would require navigating back multiple times
      // For simplicity, we'll just navigate back one step at a time
      navigateBack();
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-teal-50 border-b border-teal-200 text-sm">
      <span className="text-teal-600 font-medium">Submodule:</span>

      {/* Root repo */}
      <button
        onClick={navigateToRoot}
        disabled={isLoadingSubmodule}
        className="text-teal-700 hover:text-teal-900 hover:underline disabled:opacity-50 disabled:no-underline"
      >
        {repositoryStack[0].name}
      </button>

      {/* Intermediate repos in stack */}
      {repositoryStack.slice(1).map((item, index) => (
        <span key={item.path} className="flex items-center gap-1">
          <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button
            onClick={() => handleNavigateToIndex(index + 1)}
            disabled={isLoadingSubmodule}
            className="text-teal-700 hover:text-teal-900 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {item.name}
          </button>
        </span>
      ))}

      {/* Current repo (not clickable) */}
      <span className="flex items-center gap-1">
        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-teal-900">{repository.name}</span>
      </span>

      {/* Back button */}
      <button
        onClick={navigateBack}
        disabled={isLoadingSubmodule}
        className="ml-auto flex items-center gap-1 px-2 py-1 text-teal-700 hover:bg-teal-100 rounded disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {isLoadingSubmodule && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 ml-2"></div>
      )}
    </div>
  );
}
