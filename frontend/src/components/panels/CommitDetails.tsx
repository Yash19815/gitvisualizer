import { useRepositoryStore } from '../../store/repositoryStore';
import { Tabs } from '../ui/Tabs';
import { DiffViewer } from '../diff/DiffViewer';
import { FileTreePanel } from '../tree/FileTreePanel';
import { GitHubInfo } from './GitHubInfo';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CommitDetailsContent() {
  const { selectedCommit, setSelectedCommit, repository } = useRepositoryStore();

  if (!selectedCommit) return null;

  const handleParentClick = (parentHash: string) => {
    const parentCommit = repository?.commits.find(c => c.hash === parentHash);
    if (parentCommit) {
      setSelectedCommit(parentCommit);
    }
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Hash */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hash</label>
        <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded break-all">
          {selectedCommit.hash}
        </p>
      </div>

      {/* Message */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
        <p className="mt-1 text-sm font-medium text-gray-900">{selectedCommit.message}</p>
        {selectedCommit.body && (
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{selectedCommit.body}</p>
        )}
      </div>

      {/* Author */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Author</label>
        <p className="mt-1 text-sm">
          <span className="font-medium text-gray-900">{selectedCommit.author.name}</span>
          <span className="text-gray-500"> &lt;{selectedCommit.author.email}&gt;</span>
        </p>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
        <p className="mt-1 text-sm text-gray-700">{formatDate(selectedCommit.date)}</p>
      </div>

      {/* Parents */}
      {selectedCommit.parents.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Parents ({selectedCommit.parents.length})
          </label>
          <div className="mt-1 space-y-1">
            {selectedCommit.parents.map((parent, index) => (
              <button
                key={parent}
                onClick={() => handleParentClick(parent)}
                className="block w-full text-left font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
              >
                {index > 0 && <span className="text-gray-400 mr-1">(merge)</span>}
                {parent.substring(0, 12)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Refs */}
      {selectedCommit.refs.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            References
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCommit.refs.map(ref => (
              <span
                key={ref.name}
                className={`
                  text-xs px-2 py-1 rounded-full
                  ${ref.type === 'branch' ? 'bg-blue-100 text-blue-700' : ''}
                  ${ref.type === 'tag' ? 'bg-green-100 text-green-700' : ''}
                  ${ref.type === 'remote' ? 'bg-purple-100 text-purple-700' : ''}
                  ${ref.isHead ? 'font-bold ring-1 ring-blue-400' : ''}
                `}
              >
                {ref.isHead && (
                  <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {ref.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CommitDetails() {
  const { selectedCommit, setSelectedCommit, activeTab, setActiveTab, diffStats } = useRepositoryStore();

  if (!selectedCommit) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-4">
        <p className="text-center text-sm">Click on a commit to see details</p>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'changes', label: 'Changes', badge: diffStats?.files.length },
    { id: 'files', label: 'Files' },
    { id: 'github', label: 'GitHub' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 truncate">
          <span className="font-mono text-sm">{selectedCommit.shortHash}</span>
          <span className="text-gray-400 mx-2">·</span>
          <span className="text-sm font-normal text-gray-600 truncate">
            {selectedCommit.message}
          </span>
        </h3>
        <button
          onClick={() => setSelectedCommit(null)}
          className="text-gray-400 hover:text-gray-600 p-1 ml-2 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'details' && <CommitDetailsContent />}
        {activeTab === 'changes' && <DiffViewer />}
        {activeTab === 'files' && <FileTreePanel />}
        {activeTab === 'github' && <GitHubInfo />}
      </div>
    </div>
  );
}
