import { useRepositoryStore } from '../../store/repositoryStore';

export function GraphToolbar() {
  const {
    graphSettings,
    toggleCompactMode,
    toggleHideMergeCommits,
    toggleColorByAuthor,
  } = useRepositoryStore();

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1.5">
      {/* Compact Mode Toggle */}
      <button
        onClick={toggleCompactMode}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
          ${graphSettings.compactMode
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
        `}
        title={graphSettings.compactMode ? 'Switch to expanded view' : 'Switch to compact view'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {graphSettings.compactMode ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
          )}
        </svg>
        <span>{graphSettings.compactMode ? 'Compact' : 'Expanded'}</span>
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

      {/* Hide Merge Commits Toggle */}
      <button
        onClick={toggleHideMergeCommits}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
          ${graphSettings.hideMergeCommits
            ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
        `}
        title={graphSettings.hideMergeCommits ? 'Show merge commits' : 'Hide merge commits'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>{graphSettings.hideMergeCommits ? 'Merges Hidden' : 'Show Merges'}</span>
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

      {/* Color by Author Toggle */}
      <button
        onClick={toggleColorByAuthor}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
          ${graphSettings.colorByAuthor
            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
        `}
        title={graphSettings.colorByAuthor ? 'Color by branch' : 'Color by author'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {graphSettings.colorByAuthor ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          )}
        </svg>
        <span>{graphSettings.colorByAuthor ? 'By Author' : 'By Branch'}</span>
      </button>
    </div>
  );
}
