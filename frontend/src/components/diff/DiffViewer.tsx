import { useEffect } from 'react';
import { useRepositoryStore } from '../../store/repositoryStore';
import { DiffFileList } from './DiffFileList';
import { DiffContent } from './DiffContent';

export function DiffViewer() {
  const {
    selectedCommit,
    diffStats,
    selectedFileDiff,
    isLoadingDiff,
    diffError,
    fetchDiffStats,
    fetchFileDiff,
    clearFileDiff,
  } = useRepositoryStore();

  // Fetch diff stats when component mounts or commit changes
  useEffect(() => {
    if (selectedCommit && !diffStats && !isLoadingDiff) {
      fetchDiffStats();
    }
  }, [selectedCommit, diffStats, isLoadingDiff, fetchDiffStats]);

  if (!selectedCommit) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Select a commit to view changes
      </div>
    );
  }

  if (isLoadingDiff && !diffStats) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-500">Loading changes...</span>
      </div>
    );
  }

  if (diffError) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        <div className="text-2xl mb-2">⚠️</div>
        <div>{diffError}</div>
      </div>
    );
  }

  // Show file diff content if a file is selected
  if (selectedFileDiff) {
    return <DiffContent diff={selectedFileDiff} onBack={clearFileDiff} />;
  }

  // Show file list
  return (
    <div className="flex flex-col h-full">
      {/* Summary header */}
      {diffStats && (
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-sm">
          <span className="text-gray-600">{diffStats.files.length} files changed</span>
          {diffStats.totalAdditions > 0 && (
            <>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-green-600">+{diffStats.totalAdditions}</span>
            </>
          )}
          {diffStats.totalDeletions > 0 && (
            <>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-red-600">-{diffStats.totalDeletions}</span>
            </>
          )}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-auto">
        {diffStats && (
          <DiffFileList
            files={diffStats.files}
            onFileSelect={fetchFileDiff}
          />
        )}
      </div>

      {/* Loading indicator for file diff */}
      {isLoadingDiff && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
