import { useState, useMemo } from 'react';
import type { FileBusFactor } from '../../types';

interface BusFactorListProps {
  data: FileBusFactor[];
}

type SortField = 'busFactor' | 'primaryAuthor.percentage' | 'totalCommits' | 'uniqueContributors';

export function BusFactorList({ data }: BusFactorListProps) {
  const [sortField, setSortField] = useState<SortField>('busFactor');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortField === 'primaryAuthor.percentage') {
        aVal = a.primaryAuthor.percentage;
        bVal = b.primaryAuthor.percentage;
      } else {
        aVal = a[sortField as keyof FileBusFactor] as number;
        bVal = b[sortField as keyof FileBusFactor] as number;
      }

      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection(field === 'busFactor' ? 'asc' : 'desc');
    }
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getRiskColor = (busFactor: number) => {
    if (busFactor === 1) return 'bg-red-500';
    if (busFactor === 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLabel = (busFactor: number) => {
    if (busFactor === 1) return 'High Risk';
    if (busFactor === 2) return 'Medium Risk';
    return 'Low Risk';
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={`w-3 h-3 ml-1 inline ${sortField === field ? 'opacity-100' : 'opacity-0'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={sortDirection === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
      />
    </svg>
  );

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">High Risk (1 contributor)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">Medium Risk (2 contributors)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Low Risk (3+ contributors)</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
              File
            </th>
            <th
              className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('busFactor')}
            >
              Risk <SortIcon field="busFactor" />
            </th>
            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
              Primary Author
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('primaryAuthor.percentage')}
            >
              Ownership <SortIcon field="primaryAuthor.percentage" />
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('totalCommits')}
            >
              Commits <SortIcon field="totalCommits" />
            </th>
            <th
              className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('uniqueContributors')}
            >
              Contributors <SortIcon field="uniqueContributors" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => (
            <>
              <tr
                key={file.path}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => toggleExpand(file.path)}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedPaths.has(file.path) ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100 truncate max-w-[300px]" title={file.path}>
                      {file.path}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(file.busFactor)}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {getRiskLabel(file.busFactor)}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                  {file.primaryAuthor.name}
                </td>
                <td className="text-right py-2 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${file.primaryAuthor.percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 w-12 text-right">
                      {file.primaryAuthor.percentage.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                  {file.totalCommits}
                </td>
                <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                  {file.uniqueContributors}
                </td>
              </tr>
              {expandedPaths.has(file.path) && (
                <tr key={`${file.path}-expanded`}>
                  <td colSpan={6} className="bg-gray-50 dark:bg-gray-800/50 px-8 py-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Contributor breakdown:
                    </div>
                    <div className="space-y-2">
                      {file.contributors.map((contributor) => (
                        <div key={contributor.email} className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{
                              backgroundColor: `hsl(${contributor.email.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 50%, 50%)`,
                            }}
                          >
                            {contributor.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-900 dark:text-gray-100">{contributor.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{contributor.email}</div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {contributor.commits} commits ({contributor.percentage.toFixed(0)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No files with enough commits to analyze
        </div>
      )}
    </div>
  );
}
