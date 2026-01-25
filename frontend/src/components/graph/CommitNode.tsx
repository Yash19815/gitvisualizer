import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { CommitNodeData } from '../../utils/layoutEngine';

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

interface CommitNodeProps {
  data: CommitNodeData;
  selected?: boolean;
}

export const CommitNode = memo(({ data, selected }: CommitNodeProps) => {
  const { commit, color } = data;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md
        w-[280px] transition-all duration-200 cursor-pointer
        hover:shadow-lg
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{ borderColor: color }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ background: color }}
      />

      <div className="flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
          style={{ background: color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <code className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {commit.shortHash}
            </code>
            {commit.refs.slice(0, 3).map(ref => (
              <span
                key={ref.name}
                className={`
                  text-xs px-2 py-0.5 rounded-full truncate max-w-[100px]
                  ${ref.type === 'branch' ? 'bg-blue-100 text-blue-700' : ''}
                  ${ref.type === 'tag' ? 'bg-green-100 text-green-700' : ''}
                  ${ref.type === 'remote' ? 'bg-purple-100 text-purple-700' : ''}
                  ${ref.isHead ? 'font-bold ring-1 ring-blue-400' : ''}
                `}
                title={ref.name}
              >
                {ref.name}
              </span>
            ))}
            {commit.refs.length > 3 && (
              <span className="text-xs text-gray-400">
                +{commit.refs.length - 3}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-gray-900 truncate" title={commit.message}>
            {commit.message}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {commit.author.name} &middot; {formatRelativeDate(commit.date)}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ background: color }}
      />
    </div>
  );
});

CommitNode.displayName = 'CommitNode';
