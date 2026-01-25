import { useState } from 'react';
import type { Submodule } from '../../types';

interface SubmoduleListProps {
  submodules: Submodule[];
}

export function SubmoduleList({ submodules }: SubmoduleListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (submodules.length === 0) return null;

  return (
    <div className="border-t border-gray-200">
      <button
        className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Submodules
          <span className="text-xs text-gray-400">({submodules.length})</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          {submodules.map((submodule) => (
            <div
              key={submodule.path}
              className="p-2 rounded-lg hover:bg-gray-50 border border-gray-100"
            >
              <div className="flex items-start gap-2">
                {/* Status indicator */}
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    submodule.initialized ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  title={submodule.initialized ? 'Initialized' : 'Not initialized'}
                />

                <div className="flex-1 min-w-0">
                  {/* Path/Name */}
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-sm text-gray-800 truncate">
                      {submodule.name}
                    </span>
                  </div>

                  {/* Path (if different from name) */}
                  {submodule.path !== submodule.name && (
                    <div className="text-xs text-gray-500 truncate">
                      {submodule.path}
                    </div>
                  )}

                  {/* Commit hash */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {submodule.currentCommit.substring(0, 7)}
                    </span>
                    {!submodule.initialized && (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                        not initialized
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="text-xs text-gray-400 truncate mt-1" title={submodule.url}>
                    {submodule.url}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
