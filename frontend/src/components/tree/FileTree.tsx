import type { TreeEntry } from "../../types";

interface FileTreeProps {
  entries: TreeEntry[];
  expandedPaths: Set<string>;
  selectedPath?: string;
  onToggleExpand: (path: string) => void;
  onFileSelect: (path: string) => void;
  parentPath?: string;
}

function getFileIcon(name: string, type: "file" | "directory"): string {
  if (type === "directory") return "📁";

  const ext = name.split(".").pop()?.toLowerCase();
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
    case "lock":
      return "🔒";
    case "gitignore":
    case "env":
      return "⚙️";
    default:
      return "📄";
  }
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TreeNode({
  entry,
  entries,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onFileSelect,
  depth = 0,
}: {
  entry: TreeEntry;
  entries: TreeEntry[];
  expandedPaths: Set<string>;
  selectedPath?: string;
  onToggleExpand: (path: string) => void;
  onFileSelect: (path: string) => void;
  depth?: number;
}) {
  const isExpanded = expandedPaths.has(entry.path);
  const isSelected = selectedPath === entry.path;

  // Find children of this directory
  const children =
    entry.type === "directory"
      ? entries.filter((e) => {
          // Check if e is a direct child of entry
          const parent = e.path.split("/").slice(0, -1).join("/");
          return parent === entry.path;
        })
      : [];

  const handleClick = () => {
    if (entry.type === "directory") {
      onToggleExpand(entry.path);
    } else {
      onFileSelect(entry.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full text-left px-2 py-1 hover:bg-gray-100 transition-colors flex items-center gap-1
          ${isSelected ? "bg-blue-50" : ""}
        `}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand/collapse arrow for directories */}
        {entry.type === "directory" && (
          <span className="w-4 text-gray-400 text-xs">
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
        {entry.type === "file" && <span className="w-4" />}

        {/* Icon */}
        <span className="text-sm">{getFileIcon(entry.name, entry.type)}</span>

        {/* Name */}
        <span className="flex-1 text-sm text-gray-700 truncate">
          {entry.name}
        </span>

        {/* Size (for files) */}
        {entry.type === "file" && entry.size !== undefined && (
          <span className="text-xs text-gray-400">
            {formatSize(entry.size)}
          </span>
        )}
      </button>

      {/* Render children if expanded */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              entries={entries}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              onToggleExpand={onToggleExpand}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  entries,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onFileSelect,
  parentPath = "",
}: FileTreeProps) {
  // Get root-level entries (no parent path or direct children of parentPath)
  const rootEntries = entries.filter((e) => {
    const parts = e.path.split("/");
    return (
      parts.length === 1 ||
      (parentPath &&
        e.path.startsWith(parentPath + "/") &&
        parts.length === parentPath.split("/").length + 1)
    );
  });

  // If no parentPath, show entries without a slash (root level)
  const displayEntries = parentPath
    ? rootEntries
    : entries.filter((e) => !e.path.includes("/"));

  if (displayEntries.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No files found
      </div>
    );
  }

  return (
    <div className="py-1">
      {displayEntries.map((entry) => (
        <TreeNode
          key={entry.path}
          entry={entry}
          entries={entries}
          expandedPaths={expandedPaths}
          selectedPath={selectedPath}
          onToggleExpand={onToggleExpand}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}
