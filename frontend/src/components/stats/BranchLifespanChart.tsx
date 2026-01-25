import { useMemo } from 'react';
import type { BranchLifespan } from '../../types';

interface BranchLifespanChartProps {
  data: BranchLifespan[];
}

export function BranchLifespanChart({ data }: BranchLifespanChartProps) {
  const maxLifespan = useMemo(() => {
    return Math.max(...data.map(b => b.lifespanDays || 0), 1);
  }, [data]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, merged: 0, stale: 0 };
    for (const branch of data) {
      counts[branch.status]++;
    }
    return counts;
  }, [data]);

  const getStatusColor = (status: BranchLifespan['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500';
      case 'merged':
        return 'bg-green-500';
      case 'stale':
        return 'bg-gray-400';
    }
  };

  const getStatusBgColor = (status: BranchLifespan['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'merged':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'stale':
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLifespan = (days: number | null) => {
    if (days === null) return 'N/A';
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${(days / 365).toFixed(1)} years`;
  };

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {statusCounts.active}
            </span>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Active Branches</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
              {statusCounts.merged}
            </span>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Merged Branches</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {statusCounts.stale}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Stale Branches</div>
        </div>
      </div>

      {/* Branch list */}
      <div className="space-y-3">
        {data.map((branch) => (
          <div
            key={branch.branchName}
            className={`p-3 rounded-lg ${getStatusBgColor(branch.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(branch.status)}`} />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {branch.branchName}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                  branch.status === 'active'
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    : branch.status === 'merged'
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {branch.status}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {branch.commitCount} commits
              </div>
            </div>

            {/* Timeline bar */}
            <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getStatusColor(branch.status)} opacity-80`}
                style={{
                  width: `${Math.max(5, ((branch.lifespanDays || 0) / maxLifespan) * 100)}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {formatDate(branch.createdAt)}
                </span>
                {branch.mergedAt && (
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDate(branch.mergedAt)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lifespan: {formatLifespan(branch.lifespanDays)}
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No branches to analyze
        </div>
      )}
    </div>
  );
}
