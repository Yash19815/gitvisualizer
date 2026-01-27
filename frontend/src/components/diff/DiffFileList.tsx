import type { FileDiff } from "../../types";

interface DiffFileListProps {
  files: FileDiff[];
  selectedPath?: string;
  onFileSelect: (filePath: string) => void;
}

function getStatusColor(status: FileDiff["status"]): string {
  switch (status) {
    case "added":
      return "text-green-600 bg-green-50";
    case "deleted":
      return "text-red-600 bg-red-50";
    case "modified":
      return "text-amber-600 bg-amber-50";
    case "renamed":
    case "copied":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

function getStatusLabel(status: FileDiff["status"]): string {
  switch (status) {
    case "added":
      return "A";
    case "deleted":
      return "D";
    case "modified":
      return "M";
    case "renamed":
      return "R";
    case "copied":
      return "C";
    default:
      return "?";
  }
}

function getFileIcon(path: string, status: FileDiff["status"]): string {
  if (status === "deleted") return "🗑️";

  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "📘";
    case "js":
    case "jsx":
      return "📒";
    case "json":
      return "📋";
    case "css":
    case "scss":
      return "🎨";
    case "html":
      return "🌐";
    case "md":
      return "📝";
    case "png":
    case "jpg":
    case "gif":
    case "svg":
      return "🖼️";
    default:
      return "📄";
  }
}

export function DiffFileList({
  files,
  selectedPath,
  onFileSelect,
}: DiffFileListProps) {
  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No files changed in this commit
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {files.map((file) => (
        <button
          key={file.path}
          onClick={() => onFileSelect(file.path)}
          className={`
            w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors
            ${selectedPath === file.path ? "bg-blue-50" : ""}
          `}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${getStatusColor(file.status)}`}
            >
              {getStatusLabel(file.status)}
            </span>
            <span className="text-sm">
              {getFileIcon(file.path, file.status)}
            </span>
            <span className="flex-1 text-sm text-gray-700 truncate font-mono">
              {file.oldPath ? (
                <>
                  <span className="text-gray-400">{file.oldPath}</span>
                  <span className="text-gray-400 mx-1">→</span>
                  {file.path}
                </>
              ) : (
                file.path
              )}
            </span>
            {!file.binary && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {file.additions > 0 && (
                  <span className="text-green-600">+{file.additions}</span>
                )}
                {file.additions > 0 && file.deletions > 0 && (
                  <span className="mx-1">/</span>
                )}
                {file.deletions > 0 && (
                  <span className="text-red-600">-{file.deletions}</span>
                )}
              </span>
            )}
            {file.binary && (
              <span className="text-xs text-gray-400">binary</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
