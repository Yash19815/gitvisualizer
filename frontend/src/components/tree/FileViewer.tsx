import { Highlight, themes } from 'prism-react-renderer';
import type { FileContent } from '../../types';

interface FileViewerProps {
  file: FileContent;
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
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    default:
      return 'text';
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileViewer({ file, onBack }: FileViewerProps) {
  const language = getLanguage(file.path);

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
          {file.path}
        </span>
        <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {file.binary ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-sm">Binary file - cannot display content</div>
            <div className="text-xs text-gray-400 mt-1">{formatSize(file.size)}</div>
          </div>
        ) : (
          <Highlight theme={themes.github} code={file.content} language={language}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} text-xs font-mono overflow-x-auto`}
                style={{ ...style, margin: 0, padding: 0 }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} className="flex hover:bg-gray-50">
                    {/* Line number */}
                    <span className="w-12 flex-shrink-0 text-right pr-4 text-gray-400 select-none bg-gray-50 border-r border-gray-200">
                      {i + 1}
                    </span>
                    {/* Code */}
                    <span className="pl-4 flex-1">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
}
