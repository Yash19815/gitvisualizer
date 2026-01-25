import { useState, useMemo } from 'react';
import type { ContributorStats } from '../../types';
import { cn } from '../../lib/utils';

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

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

const avatarColors = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-pink-600',
];

export function ContributorList({ contributors }: ContributorListProps) {
  const [sortField, setSortField] = useState<SortField>('commitCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { sortedContributors, maxCommits, maxAdditions, maxDeletions, totalStats } = useMemo(() => {
    const sorted = [...contributors].sort((a, b) => {
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

    const maxCommits = Math.max(...contributors.map(c => c.commitCount));
    const maxAdditions = Math.max(...contributors.map(c => c.additions));
    const maxDeletions = Math.max(...contributors.map(c => c.deletions));
    const totalStats = contributors.reduce(
      (acc, c) => ({
        commits: acc.commits + c.commitCount,
        additions: acc.additions + c.additions,
        deletions: acc.deletions + c.deletions,
      }),
      { commits: 0, additions: 0, deletions: 0 }
    );

    return { sortedContributors: sorted, maxCommits, maxAdditions, maxDeletions, totalStats };
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
        <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
      </svg>
    );
  };

  if (contributors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm font-medium">No contributor data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(totalStats.commits)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Commits</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{formatNumber(totalStats.additions)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lines Added</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{formatNumber(totalStats.deletions)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lines Removed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <th
                className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Contributor
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('commitCount')}
              >
                <div className="flex items-center justify-end gap-2">
                  Commits
                  <SortIcon field="commitCount" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('additions')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">Additions</span>
                  <SortIcon field="additions" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('deletions')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className="text-red-600 dark:text-red-400">Deletions</span>
                  <SortIcon field="deletions" />
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                Active Period
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {sortedContributors.map((contributor, index) => (
              <tr key={contributor.email} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md bg-gradient-to-br",
                      avatarColors[index % avatarColors.length]
                    )}>
                      {contributor.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{contributor.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {contributor.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {contributor.commitCount.toLocaleString()}
                    </span>
                    <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: `${(contributor.commitCount / maxCommits) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatNumber(contributor.additions)}
                    </span>
                    <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        style={{ width: `${(contributor.additions / maxAdditions) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-medium text-red-600 dark:text-red-400">
                      -{formatNumber(contributor.deletions)}
                    </span>
                    <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                        style={{ width: `${(contributor.deletions / maxDeletions) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div className="font-medium text-gray-700 dark:text-gray-300">{formatDate(contributor.firstCommit)}</div>
                    <div className="text-gray-400 dark:text-gray-500">to {formatDate(contributor.lastCommit)}</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
