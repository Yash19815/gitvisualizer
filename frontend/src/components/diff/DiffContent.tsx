import { Highlight, themes } from 'prism-react-renderer';
import type { FileDiffDetail, DiffHunk } from '../../types';

interface DiffContentProps {
  diff: FileDiffDetail;
  onBack: () => void;
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'text';
  }
}

function DiffHunkView({ hunk, language }: { hunk: DiffHunk; language: string }) {
  const lines = hunk.content.split('\n');

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Hunk header */}
      <div className="bg-blue-50 px-3 py-1 text-xs font-mono text-blue-700">
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>

      {/* Diff lines */}
      <div className="font-mono text-xs overflow-x-auto">
        {lines.map((line, index) => {
          const isAddition = line.startsWith('+');
          const isDeletion = line.startsWith('-');
          const lineContent = line.slice(1) || ' ';

          let bgClass = '';
          let textClass = 'text-gray-700';
          let lineNumClass = 'text-gray-400';

          if (isAddition) {
            bgClass = 'bg-green-50';
            textClass = 'text-green-800';
            lineNumClass = 'text-green-600';
          } else if (isDeletion) {
            bgClass = 'bg-red-50';
            textClass = 'text-red-800';
            lineNumClass = 'text-red-600';
          }

          return (
            <div key={index} className={`flex ${bgClass}`}>
              {/* Line indicator */}
              <div
                className={`w-6 flex-shrink-0 text-center select-none ${lineNumClass}`}
              >
                {isAddition ? '+' : isDeletion ? '-' : ' '}
              </div>

              {/* Code content with syntax highlighting */}
              <Highlight theme={themes.github} code={lineContent} language={language}>
                {({ tokens, getTokenProps }) => (
                  <pre className={`flex-1 px-2 py-0.5 ${textClass}`}>
                    {tokens[0]?.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DiffContent({ diff, onBack }: DiffContentProps) {
  const language = getLanguage(diff.path);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-mono text-sm text-gray-700 truncate flex-1">
          {diff.oldPath ? (
            <>
              <span className="text-gray-400">{diff.oldPath}</span>
              <span className="text-gray-400 mx-1">→</span>
              {diff.path}
            </>
          ) : (
            diff.path
          )}
        </span>
        <div className="text-xs text-gray-500">
          <span className="text-green-600">+{diff.additions}</span>
          <span className="mx-1">/</span>
          <span className="text-red-600">-{diff.deletions}</span>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {diff.binary ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <div>Binary file - cannot display diff</div>
          </div>
        ) : diff.hunks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📄</div>
            <div>No changes to display</div>
          </div>
        ) : (
          diff.hunks.map((hunk, index) => (
            <DiffHunkView key={index} hunk={hunk} language={language} />
          ))
        )}
      </div>
    </div>
  );
}
