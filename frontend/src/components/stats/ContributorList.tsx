import { useState, useMemo } from 'react';
import type { ContributorStats } from '../../types';

interface ContributorListProps {
  contributors: ContributorStats[];
}

type SortField = 'commitCount' | 'additions' | 'deletions' | 'name';
type SortDirection = 'asc' | 'desc';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ContributorList({ contributors }: ContributorListProps) {
  const [sortField, setSortField] = useState<SortField>('commitCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedContributors = useMemo(() => {
    return [...contributors].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'commitCount':
          comparison = a.commitCount - b.commitCount;
          break;
        case 'additions':
          comparison = a.additions - b.additions;
          break;
        case 'deletions':
          comparison = a.deletions - b.deletions;
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [contributors, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={sortDirection === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
        />
      </svg>
    );
  };

  if (contributors.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No contributor data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                Contributor
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className="px-3 py-2 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('commitCount')}
            >
              <div className="flex items-center justify-end gap-1">
                Commits
                <SortIcon field="commitCount" />
              </div>
            </th>
            <th
              className="px-3 py-2 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('additions')}
            >
              <div className="flex items-center justify-end gap-1">
                <span className="text-green-600">+</span>
                <SortIcon field="additions" />
              </div>
            </th>
            <th
              className="px-3 py-2 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('deletions')}
            >
              <div className="flex items-center justify-end gap-1">
                <span className="text-red-600">-</span>
                <SortIcon field="deletions" />
              </div>
            </th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">
              Active Period
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedContributors.map((contributor, index) => (
            <tr key={contributor.email} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 50%)`,
                    }}
                  >
                    {contributor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{contributor.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                      {contributor.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 text-right font-mono text-gray-700">
                {contributor.commitCount.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right font-mono text-green-600">
                +{contributor.additions.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right font-mono text-red-600">
                -{contributor.deletions.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right text-xs text-gray-500">
                <div>{formatDate(contributor.firstCommit)}</div>
                <div>to {formatDate(contributor.lastCommit)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
