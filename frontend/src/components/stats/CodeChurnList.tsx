import { useState, useMemo } from "react";
import type { FileChurnStats } from "../../types";

interface CodeChurnListProps {
  data: FileChurnStats[];
}

type SortField =
  | "churnScore"
  | "changeCount"
  | "totalAdditions"
  | "totalDeletions";

export function CodeChurnList({ data }: CodeChurnListProps) {
  const [sortField, setSortField] = useState<SortField>("churnScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [data, sortField, sortDirection]);

  const maxChurn = useMemo(
    () => Math.max(...data.map((d) => d.churnScore)),
    [data],
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={`w-3 h-3 ml-1 inline ${sortField === field ? "opacity-100" : "opacity-0"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={sortDirection === "desc" ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
      />
    </svg>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
              File
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort("churnScore")}
            >
              Churn Score <SortIcon field="churnScore" />
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort("changeCount")}
            >
              Changes <SortIcon field="changeCount" />
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort("totalAdditions")}
            >
              Additions <SortIcon field="totalAdditions" />
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort("totalDeletions")}
            >
              Deletions <SortIcon field="totalDeletions" />
            </th>
            <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
              Authors
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => (
            <tr
              key={file.path}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: `hsl(${Math.max(0, 120 - (file.churnScore / maxChurn) * 120)}, 70%, 50%)`,
                    }}
                  />
                  <span
                    className="font-mono text-xs text-gray-900 dark:text-gray-100 truncate max-w-[300px]"
                    title={file.path}
                  >
                    {file.path}
                  </span>
                </div>
                {/* Churn bar */}
                <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(file.churnScore / maxChurn) * 100}%`,
                      backgroundColor: `hsl(${Math.max(0, 120 - (file.churnScore / maxChurn) * 120)}, 70%, 50%)`,
                    }}
                  />
                </div>
              </td>
              <td className="text-right py-2 px-3 font-medium text-gray-900 dark:text-gray-100">
                {file.churnScore.toFixed(1)}
              </td>
              <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                {file.changeCount}
              </td>
              <td className="text-right py-2 px-3 text-green-600 dark:text-green-400">
                +{file.totalAdditions.toLocaleString()}
              </td>
              <td className="text-right py-2 px-3 text-red-600 dark:text-red-400">
                -{file.totalDeletions.toLocaleString()}
              </td>
              <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                {file.authors.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No files with enough changes to analyze
        </div>
      )}
    </div>
  );
}
