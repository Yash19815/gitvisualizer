import { ReactFlowProvider } from '@xyflow/react';
import { PathInput } from './components/inputs/PathInput';
import { GraphCanvas } from './components/graph/GraphCanvas';
import { BranchList } from './components/panels/BranchList';
import { CommitDetails } from './components/panels/CommitDetails';
import { SubmoduleDetails } from './components/panels/SubmoduleDetails';
import { ProgressBar } from './components/ui/ProgressBar';
import { LargeRepoWarning } from './components/ui/LargeRepoWarning';
import { AuthTokenModal } from './components/ui/AuthTokenModal';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { StatsPanel } from './components/stats/StatsPanel';
import { BranchComparePanel } from './components/compare/BranchComparePanel';
import { RepositoryBreadcrumb } from './components/navigation/RepositoryBreadcrumb';
import { useRepositoryStore } from './store/repositoryStore';
import { useRepoUrl } from './hooks/useRepoUrl';

function App() {
  const { repository, error, loadMode, toggleStatsPanel, toggleBranchComparePanel, selectedSubmodule } = useRepositoryStore();

  // Enable URL-based repository loading (e.g., /github.com/user/repo)
  useRepoUrl();

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Progress Bar */}
      <ProgressBar />
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Git Visualizer</h1>
          </div>
          <div className="flex-1 max-w-2xl">
            <PathInput />
          </div>
          {repository && (
            <>
              <button
                onClick={toggleBranchComparePanel}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
                Compare
              </button>
              <button
                onClick={toggleStatsPanel}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Stats
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </header>

      {/* Submodule Breadcrumb */}
      <RepositoryBreadcrumb />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Branch List */}
        {repository && (
          <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
            <BranchList />
          </aside>
        )}

        {/* Graph Canvas */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <GraphCanvas />
          </ReactFlowProvider>
        </div>

        {/* Right Sidebar - Commit or Submodule Details */}
        {repository && (
          selectedSubmodule ? (
            <SubmoduleDetails />
          ) : (
            <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0">
              <CommitDetails />
            </aside>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {repository ? (
              <>
                Showing {repository.commits.length.toLocaleString()}
                {repository.totalCommitCount && repository.totalCommitCount > repository.commits.length && (
                  <> of {repository.totalCommitCount.toLocaleString()}</>
                )}
                {' '}commits from <strong className="text-gray-700 dark:text-gray-300">{repository.name}</strong>
                {loadMode !== 'full' && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] uppercase">
                    {loadMode === 'simplified' ? 'Simplified' : 'Streaming'}
                  </span>
                )}
              </>
            ) : (
              'Enter a repository path to get started'
            )}
          </span>
          <span>Pan: drag | Zoom: scroll | Select: click</span>
        </div>
      </footer>

      {/* Large Repo Warning Modal */}
      <LargeRepoWarning />

      {/* Stats Panel Modal */}
      <StatsPanel />

      {/* Branch Compare Panel Modal */}
      <BranchComparePanel />

      {/* Auth Token Modal for Private Repos */}
      <AuthTokenModal />
    </div>
  );
}

export default App;
