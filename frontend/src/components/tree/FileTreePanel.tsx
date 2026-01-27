import { useEffect } from "react";
import { useRepositoryStore } from "../../store/repositoryStore";
import { FileTree } from "./FileTree";
import { FileViewer } from "./FileViewer";

export function FileTreePanel() {
  const {
    selectedCommit,
    fileTree,
    expandedPaths,
    selectedFile,
    isLoadingTree,
    isLoadingFile,
    fileError,
    fetchFileTreeRoot,
    toggleExpandPath,
    fetchFileContent,
    clearFileContent,
  } = useRepositoryStore();

  // Fetch root tree when component mounts or commit changes
  useEffect(() => {
    if (selectedCommit && fileTree.length === 0 && !isLoadingTree) {
      fetchFileTreeRoot();
    }
  }, [selectedCommit, fileTree.length, isLoadingTree, fetchFileTreeRoot]);

  if (!selectedCommit) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Select a commit to browse files
      </div>
    );
  }

  if (isLoadingTree && fileTree.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-500">Loading file tree...</span>
      </div>
    );
  }

  if (fileError && fileTree.length === 0) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        <div className="text-2xl mb-2">⚠️</div>
        <div>{fileError}</div>
      </div>
    );
  }

  // Show file content if a file is selected
  if (selectedFile) {
    return <FileViewer file={selectedFile} onBack={clearFileContent} />;
  }

  // Show file tree
  return (
    <div className="flex flex-col h-full relative">
      {/* Tree view */}
      <div className="flex-1 overflow-auto">
        <FileTree
          entries={fileTree}
          expandedPaths={expandedPaths}
          onToggleExpand={toggleExpandPath}
          onFileSelect={fetchFileContent}
        />
      </div>

      {/* Loading overlay */}
      {(isLoadingTree || isLoadingFile) && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
