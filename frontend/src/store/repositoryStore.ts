import { create } from 'zustand';
import type {
  Repository,
  Commit,
  RepoStats,
  RepositoryMetadata,
  DiffStats,
  FileDiffDetail,
  TreeEntry,
  FileContent,
  ContributorStats,
  ActivityDay,
  Submodule,
  DateRange,
  BranchComparison,
  GitHubRepoInfo,
  CommitGitHubInfo,
  RepositoryStackItem,
} from '../types';
import {
  loadRepository,
  uploadRepository,
  uploadFolder,
  cloneRepository,
  getRepoStats,
  streamRepository,
  getCommitsPaginated,
  getCommitDiffStats,
  getCommitFileDiff,
  getFileTree,
  getFileContent,
  getContributorStats,
  getActivityHeatmap,
  getSubmodules,
  compareBranches,
  loadSubmoduleRepository,
} from '../api/gitApi';
import {
  setGitHubToken as setGitHubTokenApi,
  getGitHubRepoInfo,
  getCommitGitHubInfo,
} from '../api/githubApi';

export type LoadMode = 'full' | 'paginated' | 'simplified';
export type DetailTab = 'details' | 'changes' | 'files' | 'github';

// Pre-computed adjacency map for O(1) parent/child lookups
interface AdjacencyMap {
  children: Map<string, Set<string>>; // parent hash -> child hashes
  parents: Map<string, string[]>; // child hash -> parent hashes
}

// Build adjacency map from commits - O(n) once, then O(1) lookups
function buildAdjacencyMap(commits: Commit[]): AdjacencyMap {
  const children = new Map<string, Set<string>>();
  const parents = new Map<string, string[]>();

  for (const commit of commits) {
    parents.set(commit.hash, commit.parents);
    for (const parentHash of commit.parents) {
      if (!children.has(parentHash)) {
        children.set(parentHash, new Set());
      }
      children.get(parentHash)!.add(commit.hash);
    }
  }

  return { children, parents };
}

interface RepositoryState {
  repository: Repository | null;
  adjacencyMap: AdjacencyMap | null; // Pre-computed for fast highlighting
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number; // 0-100, -1 for indeterminate
  error: string | null;
  selectedCommit: Commit | null;
  searchQuery: string;

  // Large repo handling
  repoStats: RepoStats | null;
  showLargeRepoWarning: boolean;
  pendingPath: string | null;
  loadMode: LoadMode;
  abortStream: (() => void) | null;

  // Diff viewer state
  activeTab: DetailTab;
  diffStats: DiffStats | null;
  selectedFileDiff: FileDiffDetail | null;
  isLoadingDiff: boolean;
  diffError: string | null;

  // File tree state
  fileTree: TreeEntry[];
  expandedPaths: Set<string>;
  selectedFile: FileContent | null;
  isLoadingTree: boolean;
  isLoadingFile: boolean;
  fileError: string | null;

  // Stats state
  contributorStats: ContributorStats[] | null;
  activityHeatmap: ActivityDay[] | null;
  isLoadingStats: boolean;
  statsError: string | null;
  showStatsPanel: boolean;

  // Submodule state
  submodules: Submodule[] | null;
  selectedSubmodule: Submodule | null;
  repositoryStack: RepositoryStackItem[]; // For breadcrumb navigation
  isLoadingSubmodule: boolean;
  submoduleError: string | null;

  // GitHub integration state
  githubRepoInfo: GitHubRepoInfo | null;
  githubToken: string | null;
  commitGitHubInfo: Map<string, CommitGitHubInfo>;
  isLoadingGitHubInfo: boolean;
  githubError: string | null;

  // Date filter state
  dateFilter: DateRange | null;

  // Branch filter state
  selectedBranchFilter: string | null;

  // Branch comparison state
  branchComparison: BranchComparison | null;
  showBranchComparePanel: boolean;
  compareBaseBranch: string | null;
  compareTargetBranch: string | null;
  isLoadingComparison: boolean;
  comparisonError: string | null;

  // Graph settings state
  graphSettings: {
    compactMode: boolean;
    hideMergeCommits: boolean;
    colorByAuthor: boolean;
  };
  highlightedCommits: Set<string>; // Parent and child hashes of selected commit

  // Actions
  loadRepo: (path: string) => Promise<void>;
  loadRepoWithMode: (path: string, mode: LoadMode) => Promise<void>;
  loadMoreCommits: () => Promise<void>;
  cloneRepo: (url: string, options?: { shallow?: boolean }) => Promise<void>;
  uploadRepo: (file: File) => Promise<void>;
  uploadFolderRepo: (files: FileList) => Promise<void>;
  setSelectedCommit: (commit: Commit | null) => void;
  setSearchQuery: (query: string) => void;
  dismissLargeRepoWarning: () => void;
  confirmLoadLargeRepo: (mode: LoadMode) => void;
  reset: () => void;

  // Diff and file tree actions
  setActiveTab: (tab: DetailTab) => void;
  fetchDiffStats: () => Promise<void>;
  fetchFileDiff: (filePath: string) => Promise<void>;
  clearFileDiff: () => void;
  fetchFileTreeRoot: () => Promise<void>;
  fetchFileTreePath: (treePath: string) => Promise<void>;
  toggleExpandPath: (path: string) => void;
  fetchFileContent: (filePath: string) => Promise<void>;
  clearFileContent: () => void;

  // Stats and submodule actions
  fetchStats: () => Promise<void>;
  toggleStatsPanel: () => void;
  fetchSubmodules: () => Promise<void>;

  // Date filter actions
  setDateFilter: (dateRange: DateRange | null) => void;
  applyDateFilter: () => Promise<void>;

  // Branch filter actions
  setSelectedBranchFilter: (branch: string | null) => void;

  // Branch comparison actions
  toggleBranchComparePanel: () => void;
  setCompareBranches: (baseBranch: string | null, targetBranch: string | null) => void;
  fetchBranchComparison: () => Promise<void>;

  // Graph settings actions
  toggleCompactMode: () => void;
  toggleHideMergeCommits: () => void;
  toggleColorByAuthor: () => void;

  // GitHub integration actions
  setGitHubToken: (token: string | null) => Promise<void>;
  fetchGitHubRepoInfo: () => Promise<void>;
  fetchCommitGitHubInfo: (commitHash: string) => Promise<void>;

  // Submodule navigation actions
  setSelectedSubmodule: (submodule: Submodule | null) => void;
  navigateToSubmodule: (submodulePath: string) => Promise<void>;
  navigateBack: () => Promise<void>;
  navigateToRoot: () => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repository: null,
  adjacencyMap: null,
  isLoading: false,
  loadingMessage: '',
  loadingProgress: -1,
  error: null,
  selectedCommit: null,
  searchQuery: '',
  repoStats: null,
  showLargeRepoWarning: false,
  pendingPath: null,
  loadMode: 'full',
  abortStream: null,

  // Diff viewer state
  activeTab: 'details',
  diffStats: null,
  selectedFileDiff: null,
  isLoadingDiff: false,
  diffError: null,

  // File tree state
  fileTree: [],
  expandedPaths: new Set<string>(),
  selectedFile: null,
  isLoadingTree: false,
  isLoadingFile: false,
  fileError: null,

  // Stats state
  contributorStats: null,
  activityHeatmap: null,
  isLoadingStats: false,
  statsError: null,
  showStatsPanel: false,

  // Submodule state
  submodules: null,
  selectedSubmodule: null,
  repositoryStack: [],
  isLoadingSubmodule: false,
  submoduleError: null,

  // GitHub integration state
  githubRepoInfo: null,
  githubToken: localStorage.getItem('github_token'),
  commitGitHubInfo: new Map<string, CommitGitHubInfo>(),
  isLoadingGitHubInfo: false,
  githubError: null,

  // Date filter state
  dateFilter: null,

  // Branch filter state
  selectedBranchFilter: null,

  // Branch comparison state
  branchComparison: null,
  showBranchComparePanel: false,
  compareBaseBranch: null,
  compareTargetBranch: null,
  isLoadingComparison: false,
  comparisonError: null,

  // Graph settings state
  graphSettings: {
    compactMode: false,
    hideMergeCommits: false,
    colorByAuthor: false,
  },
  highlightedCommits: new Set<string>(),

  loadRepo: async (path: string) => {
    // Abort any existing stream
    const { abortStream } = get();
    if (abortStream) {
      abortStream();
      set({ abortStream: null });
    }

    set({
      isLoading: true,
      error: null,
      selectedCommit: null,
      loadingMessage: 'Checking repository size...',
      loadingProgress: 10,
    });

    try {
      // First, get stats to check repo size
      const stats = await getRepoStats(path);
      set({ repoStats: stats });

      if (stats.isLargeRepo) {
        // Show warning for large repos
        set({
          isLoading: false,
          showLargeRepoWarning: true,
          pendingPath: path,
          loadingProgress: -1,
          loadingMessage: '',
        });
        return;
      }

      // Small repo - load normally
      await get().loadRepoWithMode(path, 'full');
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  loadRepoWithMode: async (path: string, mode: LoadMode) => {
    const { abortStream } = get();
    if (abortStream) {
      abortStream();
    }

    set({
      isLoading: true,
      error: null,
      selectedCommit: null,
      loadMode: mode,
      showLargeRepoWarning: false,
      pendingPath: null,
    });

    try {
      if (mode === 'full') {
        // Traditional full load for small repos
        set({ loadingMessage: 'Fetching commits and branches...', loadingProgress: 50 });
        const repository = await loadRepository(path);
        const repoData = {
          ...repository,
          loadedCommitCount: repository.commits.length,
          totalCommitCount: repository.commits.length,
        };
        set({
          repository: repoData,
          adjacencyMap: buildAdjacencyMap(repository.commits), // Pre-compute for fast highlighting
          isLoading: false,
          loadingProgress: 100,
          loadingMessage: '',
        });
      } else {
        // Streaming load for large repos
        set({ loadingMessage: 'Starting stream...', loadingProgress: 5 });

        const allCommits: Commit[] = [];
        const firstParent = mode === 'simplified';

        const abort = streamRepository(
          path,
          {
            onMetadata: (metadata: RepositoryMetadata) => {
              set({
                repository: {
                  path: metadata.path,
                  name: metadata.name,
                  currentBranch: metadata.currentBranch,
                  branches: metadata.branches,
                  tags: metadata.tags,
                  commits: [],
                  stats: metadata.stats,
                  loadedCommitCount: 0,
                  totalCommitCount: metadata.stats.totalCommits,
                },
                loadingMessage: 'Loading commits...',
              });
            },
            onCommits: (commits: Commit[], progress: number, total: number) => {
              allCommits.push(...commits);
              set((state) => ({
                repository: state.repository
                  ? {
                      ...state.repository,
                      commits: [...allCommits],
                      loadedCommitCount: allCommits.length,
                      totalCommitCount: total,
                    }
                  : null,
                loadingProgress: progress,
                loadingMessage: `Loaded ${allCommits.length.toLocaleString()} of ${total.toLocaleString()} commits...`,
              }));
            },
            onComplete: () => {
              // Build adjacency map after streaming completes for fast highlighting
              const finalState = get();
              const adjacencyMap = finalState.repository?.commits
                ? buildAdjacencyMap(finalState.repository.commits)
                : null;
              set({
                isLoading: false,
                loadingProgress: 100,
                loadingMessage: '',
                abortStream: null,
                adjacencyMap,
              });
            },
            onError: (error: Error) => {
              set({
                error: error.message,
                isLoading: false,
                loadingProgress: -1,
                loadingMessage: '',
                abortStream: null,
              });
            },
          },
          { chunkSize: 1000, firstParent }
        );

        set({ abortStream: abort });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  loadMoreCommits: async () => {
    const { repository, loadMode, isLoading } = get();
    if (!repository || isLoading) return;

    const currentCount = repository.commits.length;
    const total = repository.totalCommitCount || 0;
    if (currentCount >= total) return;

    set({ isLoading: true, loadingMessage: 'Loading more commits...' });

    try {
      const result = await getCommitsPaginated(repository.path, {
        skip: currentCount,
        maxCount: 1000,
        firstParent: loadMode === 'simplified',
      });

      set((state) => {
        if (!state.repository) return { isLoading: false, loadingMessage: '' };
        const newCommits = [...state.repository.commits, ...result.commits];
        return {
          repository: {
            ...state.repository,
            commits: newCommits,
            loadedCommitCount: newCommits.length,
          },
          adjacencyMap: buildAdjacencyMap(newCommits), // Rebuild for new commits
          isLoading: false,
          loadingMessage: '',
        };
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingMessage: '',
      });
    }
  },

  cloneRepo: async (url: string, options: { shallow?: boolean } = {}) => {
    const { shallow = true } = options;

    set({
      isLoading: true,
      error: null,
      selectedCommit: null,
      loadingMessage: shallow ? 'Cloning repository (shallow)...' : 'Cloning full repository...',
      loadingProgress: -1,
    });
    try {
      set({
        loadingMessage: shallow
          ? 'Downloading recent history...'
          : 'Downloading full history (this may take a while)...',
        loadingProgress: 30,
      });
      const repository = await cloneRepository(url, { shallow });

      // Check if it's a large repo after cloning
      const stats = await getRepoStats(repository.path);
      set({ repoStats: stats });

      if (stats.isLargeRepo) {
        // Show warning for large repos - store the path for later loading
        set({
          isLoading: false,
          showLargeRepoWarning: true,
          pendingPath: repository.path,
          loadingProgress: -1,
          loadingMessage: '',
        });
        return;
      }

      set({ loadingProgress: 90, loadingMessage: 'Building graph...' });
      set({
        repository: {
          ...repository,
          loadedCommitCount: repository.commits.length,
          totalCommitCount: repository.commits.length,
        },
        adjacencyMap: buildAdjacencyMap(repository.commits),
        isLoading: false,
        loadingProgress: 100,
        loadingMessage: '',
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  uploadRepo: async (file: File) => {
    set({
      isLoading: true,
      error: null,
      selectedCommit: null,
      loadingMessage: 'Uploading ZIP...',
      loadingProgress: 20,
    });
    try {
      set({ loadingMessage: 'Extracting repository...', loadingProgress: 50 });
      const repository = await uploadRepository(file);
      set({ loadingProgress: 90, loadingMessage: 'Building graph...' });
      set({
        repository: {
          ...repository,
          loadedCommitCount: repository.commits.length,
          totalCommitCount: repository.commits.length,
        },
        adjacencyMap: buildAdjacencyMap(repository.commits),
        isLoading: false,
        loadingProgress: 100,
        loadingMessage: '',
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  uploadFolderRepo: async (files: FileList) => {
    set({
      isLoading: true,
      error: null,
      selectedCommit: null,
      loadingMessage: 'Uploading files...',
      loadingProgress: 20,
    });
    try {
      set({ loadingMessage: 'Processing repository...', loadingProgress: 50 });
      const repository = await uploadFolder(files);
      set({ loadingProgress: 90, loadingMessage: 'Building graph...' });
      set({
        repository: {
          ...repository,
          loadedCommitCount: repository.commits.length,
          totalCommitCount: repository.commits.length,
        },
        adjacencyMap: buildAdjacencyMap(repository.commits),
        isLoading: false,
        loadingProgress: 100,
        loadingMessage: '',
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  setSelectedCommit: (commit) => {
    const { adjacencyMap } = get();

    // Calculate highlighted commits using pre-computed adjacency map (O(1) lookups)
    const highlighted = new Set<string>();
    if (commit && adjacencyMap) {
      // Add parent hashes - O(p) where p is number of parents (usually 1-2)
      const parents = adjacencyMap.parents.get(commit.hash);
      if (parents) {
        parents.forEach(parentHash => highlighted.add(parentHash));
      }

      // Add child hashes - O(c) where c is number of children (usually small)
      const children = adjacencyMap.children.get(commit.hash);
      if (children) {
        children.forEach(childHash => highlighted.add(childHash));
      }
    }

    set({
      selectedCommit: commit,
      highlightedCommits: highlighted,
      // Clear diff and file state when changing commits
      diffStats: null,
      selectedFileDiff: null,
      diffError: null,
      fileTree: [],
      expandedPaths: new Set<string>(),
      selectedFile: null,
      fileError: null,
      activeTab: 'details',
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  dismissLargeRepoWarning: () =>
    set({
      showLargeRepoWarning: false,
      pendingPath: null,
      isLoading: false,
    }),

  confirmLoadLargeRepo: (mode: LoadMode) => {
    const { pendingPath } = get();
    if (pendingPath) {
      get().loadRepoWithMode(pendingPath, mode);
    }
  },

  reset: () => {
    const { abortStream } = get();
    if (abortStream) {
      abortStream();
    }
    set({
      repository: null,
      adjacencyMap: null,
      selectedCommit: null,
      searchQuery: '',
      error: null,
      repoStats: null,
      showLargeRepoWarning: false,
      pendingPath: null,
      abortStream: null,
      // Reset diff and file tree state
      activeTab: 'details',
      diffStats: null,
      selectedFileDiff: null,
      isLoadingDiff: false,
      diffError: null,
      fileTree: [],
      expandedPaths: new Set<string>(),
      selectedFile: null,
      isLoadingTree: false,
      isLoadingFile: false,
      fileError: null,
      // Reset stats and submodules state
      contributorStats: null,
      activityHeatmap: null,
      isLoadingStats: false,
      statsError: null,
      showStatsPanel: false,
      submodules: null,
      // Reset date filter and branch comparison state
      dateFilter: null,
      selectedBranchFilter: null,
      branchComparison: null,
      showBranchComparePanel: false,
      compareBaseBranch: null,
      compareTargetBranch: null,
      isLoadingComparison: false,
      comparisonError: null,
      // Reset graph settings (keep defaults)
      graphSettings: {
        compactMode: false,
        hideMergeCommits: false,
        colorByAuthor: false,
      },
      highlightedCommits: new Set<string>(),
    });
  },

  // Diff and file tree actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchDiffStats: async () => {
    const { repository, selectedCommit } = get();
    if (!repository || !selectedCommit) return;

    set({ isLoadingDiff: true, diffError: null, diffStats: null, selectedFileDiff: null });

    try {
      const stats = await getCommitDiffStats(repository.path, selectedCommit.hash);
      set({ diffStats: stats, isLoadingDiff: false });
    } catch (error) {
      set({ diffError: (error as Error).message, isLoadingDiff: false });
    }
  },

  fetchFileDiff: async (filePath: string) => {
    const { repository, selectedCommit } = get();
    if (!repository || !selectedCommit) return;

    set({ isLoadingDiff: true, diffError: null });

    try {
      const diff = await getCommitFileDiff(repository.path, selectedCommit.hash, filePath);
      set({ selectedFileDiff: diff, isLoadingDiff: false });
    } catch (error) {
      set({ diffError: (error as Error).message, isLoadingDiff: false });
    }
  },

  clearFileDiff: () => set({ selectedFileDiff: null }),

  fetchFileTreeRoot: async () => {
    const { repository, selectedCommit } = get();
    if (!repository || !selectedCommit) return;

    set({ isLoadingTree: true, fileError: null, fileTree: [], expandedPaths: new Set() });

    try {
      const tree = await getFileTree(repository.path, selectedCommit.hash);
      set({ fileTree: tree, isLoadingTree: false });
    } catch (error) {
      set({ fileError: (error as Error).message, isLoadingTree: false });
    }
  },

  fetchFileTreePath: async (treePath: string) => {
    const { repository, selectedCommit, fileTree } = get();
    if (!repository || !selectedCommit) return;

    try {
      const children = await getFileTree(repository.path, selectedCommit.hash, treePath);
      // Merge children into the tree (they'll be rendered based on expandedPaths)
      // Store children with their parent path prefix for lookup
      const newEntries = children.map(entry => ({
        ...entry,
        path: entry.path, // path already includes full path from backend
      }));

      // Add new entries that don't already exist
      const existingPaths = new Set(fileTree.map(e => e.path));
      const uniqueNewEntries = newEntries.filter(e => !existingPaths.has(e.path));

      set({ fileTree: [...fileTree, ...uniqueNewEntries] });
    } catch (error) {
      set({ fileError: (error as Error).message });
    }
  },

  toggleExpandPath: (path: string) => {
    const { expandedPaths } = get();
    const newExpanded = new Set(expandedPaths);

    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      // Fetch children when expanding
      get().fetchFileTreePath(path);
    }

    set({ expandedPaths: newExpanded });
  },

  fetchFileContent: async (filePath: string) => {
    const { repository, selectedCommit } = get();
    if (!repository || !selectedCommit) return;

    set({ isLoadingFile: true, fileError: null, selectedFile: null });

    try {
      const content = await getFileContent(repository.path, selectedCommit.hash, filePath);
      set({ selectedFile: content, isLoadingFile: false });
    } catch (error) {
      set({ fileError: (error as Error).message, isLoadingFile: false });
    }
  },

  clearFileContent: () => set({ selectedFile: null }),

  // Stats and submodule actions
  fetchStats: async () => {
    const { repository } = get();
    if (!repository) return;

    set({ isLoadingStats: true, statsError: null });

    try {
      const [contributors, activity] = await Promise.all([
        getContributorStats(repository.path),
        getActivityHeatmap(repository.path),
      ]);
      set({
        contributorStats: contributors,
        activityHeatmap: activity,
        isLoadingStats: false,
      });
    } catch (error) {
      set({ statsError: (error as Error).message, isLoadingStats: false });
    }
  },

  toggleStatsPanel: () => {
    const { showStatsPanel, repository, contributorStats } = get();
    const newShow = !showStatsPanel;
    set({ showStatsPanel: newShow });

    // Fetch stats when opening panel if not already loaded
    if (newShow && repository && !contributorStats) {
      get().fetchStats();
    }
  },

  fetchSubmodules: async () => {
    const { repository } = get();
    if (!repository) return;

    try {
      const submodules = await getSubmodules(repository.path);
      set({ submodules });
    } catch {
      // Silently fail - submodules are optional
      set({ submodules: [] });
    }
  },

  // Date filter actions
  setDateFilter: (dateRange: DateRange | null) => {
    set({ dateFilter: dateRange });
  },

  applyDateFilter: async () => {
    const { repository, dateFilter, loadMode, selectedBranchFilter } = get();
    if (!repository) return;

    set({
      isLoading: true,
      loadingMessage: 'Filtering commits...',
      loadingProgress: 30,
    });

    try {
      const result = await getCommitsPaginated(repository.path, {
        maxCount: 1000,
        skip: 0,
        firstParent: loadMode === 'simplified',
        dateRange: dateFilter || undefined,
        branch: selectedBranchFilter || undefined,
      });

      set((state) => {
        if (!state.repository) {
          return { isLoading: false, loadingProgress: 100, loadingMessage: '' };
        }
        return {
          repository: {
            ...state.repository,
            commits: result.commits,
            loadedCommitCount: result.commits.length,
            totalCommitCount: result.total,
          },
          adjacencyMap: buildAdjacencyMap(result.commits),
          isLoading: false,
          loadingProgress: 100,
          loadingMessage: '',
        };
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  // Branch filter actions
  setSelectedBranchFilter: async (branch: string | null) => {
    const { repository, dateFilter, loadMode } = get();
    if (!repository) return;

    set({
      selectedBranchFilter: branch,
      isLoading: true,
      loadingMessage: branch ? `Loading commits from ${branch}...` : 'Loading all commits...',
      loadingProgress: 30,
    });

    try {
      const result = await getCommitsPaginated(repository.path, {
        maxCount: 1000,
        skip: 0,
        firstParent: loadMode === 'simplified',
        dateRange: dateFilter || undefined,
        branch: branch || undefined,
      });

      set((state) => {
        if (!state.repository) {
          return { isLoading: false, loadingProgress: 100, loadingMessage: '' };
        }
        return {
          repository: {
            ...state.repository,
            commits: result.commits,
            loadedCommitCount: result.commits.length,
            totalCommitCount: result.total,
          },
          adjacencyMap: buildAdjacencyMap(result.commits),
          isLoading: false,
          loadingProgress: 100,
          loadingMessage: '',
        };
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        loadingProgress: -1,
        loadingMessage: '',
      });
    }
  },

  // Branch comparison actions
  toggleBranchComparePanel: () => {
    const { showBranchComparePanel, repository } = get();
    const newShow = !showBranchComparePanel;
    set({ showBranchComparePanel: newShow });

    // Set default branches when opening
    if (newShow && repository) {
      const currentBranch = repository.currentBranch;
      const localBranches = repository.branches.filter(b => !b.isRemote);
      const otherBranch = localBranches.find(b => b.name !== currentBranch)?.name || null;
      set({
        compareBaseBranch: currentBranch,
        compareTargetBranch: otherBranch,
        branchComparison: null,
        comparisonError: null,
      });
    }
  },

  setCompareBranches: (baseBranch: string | null, targetBranch: string | null) => {
    set({
      compareBaseBranch: baseBranch,
      compareTargetBranch: targetBranch,
      branchComparison: null,
      comparisonError: null,
    });
  },

  fetchBranchComparison: async () => {
    const { repository, compareBaseBranch, compareTargetBranch } = get();
    if (!repository || !compareBaseBranch || !compareTargetBranch) return;

    set({ isLoadingComparison: true, comparisonError: null });

    try {
      const comparison = await compareBranches(
        repository.path,
        compareBaseBranch,
        compareTargetBranch
      );
      set({ branchComparison: comparison, isLoadingComparison: false });
    } catch (error) {
      set({ comparisonError: (error as Error).message, isLoadingComparison: false });
    }
  },

  // Graph settings actions
  toggleCompactMode: () => {
    set((state) => ({
      graphSettings: {
        ...state.graphSettings,
        compactMode: !state.graphSettings.compactMode,
      },
    }));
  },

  toggleHideMergeCommits: () => {
    set((state) => ({
      graphSettings: {
        ...state.graphSettings,
        hideMergeCommits: !state.graphSettings.hideMergeCommits,
      },
    }));
  },

  toggleColorByAuthor: () => {
    set((state) => ({
      graphSettings: {
        ...state.graphSettings,
        colorByAuthor: !state.graphSettings.colorByAuthor,
      },
    }));
  },

  // GitHub integration actions
  setGitHubToken: async (token: string | null) => {
    try {
      await setGitHubTokenApi(token);
      if (token) {
        localStorage.setItem('github_token', token);
      } else {
        localStorage.removeItem('github_token');
      }
      set({ githubToken: token, githubError: null });
      // Refresh repo info after setting token
      get().fetchGitHubRepoInfo();
    } catch (error) {
      set({ githubError: (error as Error).message });
    }
  },

  fetchGitHubRepoInfo: async () => {
    const { repository, githubToken } = get();
    if (!repository) return;

    // Initialize token on backend if we have one stored
    if (githubToken) {
      try {
        await setGitHubTokenApi(githubToken);
      } catch {
        // Ignore token setting errors
      }
    }

    try {
      const repoInfo = await getGitHubRepoInfo(repository.path);
      set({ githubRepoInfo: repoInfo, githubError: null });
    } catch (error) {
      set({ githubRepoInfo: null, githubError: (error as Error).message });
    }
  },

  fetchCommitGitHubInfo: async (commitHash: string) => {
    const { repository, githubRepoInfo, commitGitHubInfo } = get();
    if (!repository || !githubRepoInfo?.isGitHub) return;

    // Check cache
    if (commitGitHubInfo.has(commitHash)) return;

    set({ isLoadingGitHubInfo: true, githubError: null });

    try {
      const info = await getCommitGitHubInfo(repository.path, commitHash);
      set((state) => {
        const newMap = new Map(state.commitGitHubInfo);
        newMap.set(commitHash, info);
        return { commitGitHubInfo: newMap, isLoadingGitHubInfo: false };
      });
    } catch (error) {
      set({ githubError: (error as Error).message, isLoadingGitHubInfo: false });
    }
  },

  // Submodule navigation actions
  setSelectedSubmodule: (submodule: Submodule | null) => {
    set({ selectedSubmodule: submodule });
  },

  navigateToSubmodule: async (submodulePath: string) => {
    const { repository, repositoryStack } = get();
    if (!repository) return;

    set({ isLoadingSubmodule: true, submoduleError: null });

    try {
      // Load the submodule as a repository
      const submoduleRepo = await loadSubmoduleRepository(repository.path, submodulePath);

      // Push current repo to stack for breadcrumb navigation
      const newStack = [...repositoryStack, { path: repository.path, name: repository.name }];

      set({
        repository: {
          ...submoduleRepo,
          loadedCommitCount: submoduleRepo.commits.length,
          totalCommitCount: submoduleRepo.commits.length,
        },
        adjacencyMap: buildAdjacencyMap(submoduleRepo.commits),
        repositoryStack: newStack,
        selectedCommit: null,
        selectedSubmodule: null,
        submodules: null, // Will be fetched again for nested submodules
        isLoadingSubmodule: false,
        // Reset GitHub info for new repo
        githubRepoInfo: null,
        commitGitHubInfo: new Map<string, CommitGitHubInfo>(),
      });

      // Fetch submodules and GitHub info for the new repo
      get().fetchSubmodules();
      get().fetchGitHubRepoInfo();
    } catch (error) {
      set({ submoduleError: (error as Error).message, isLoadingSubmodule: false });
    }
  },

  navigateBack: async () => {
    const { repositoryStack } = get();
    if (repositoryStack.length === 0) return;

    const newStack = [...repositoryStack];
    const previousRepo = newStack.pop()!;

    set({ isLoadingSubmodule: true, submoduleError: null });

    try {
      const repository = await loadRepository(previousRepo.path);

      set({
        repository: {
          ...repository,
          loadedCommitCount: repository.commits.length,
          totalCommitCount: repository.commits.length,
        },
        adjacencyMap: buildAdjacencyMap(repository.commits),
        repositoryStack: newStack,
        selectedCommit: null,
        selectedSubmodule: null,
        submodules: null,
        isLoadingSubmodule: false,
        // Reset GitHub info
        githubRepoInfo: null,
        commitGitHubInfo: new Map<string, CommitGitHubInfo>(),
      });

      // Fetch submodules and GitHub info
      get().fetchSubmodules();
      get().fetchGitHubRepoInfo();
    } catch (error) {
      set({ submoduleError: (error as Error).message, isLoadingSubmodule: false });
    }
  },

  navigateToRoot: () => {
    const { repositoryStack } = get();
    if (repositoryStack.length === 0) return;

    // Get root repo path
    const rootRepo = repositoryStack[0];

    set({ isLoadingSubmodule: true, submoduleError: null });

    loadRepository(rootRepo.path)
      .then((repository) => {
        set({
          repository: {
            ...repository,
            loadedCommitCount: repository.commits.length,
            totalCommitCount: repository.commits.length,
          },
          adjacencyMap: buildAdjacencyMap(repository.commits),
          repositoryStack: [],
          selectedCommit: null,
          selectedSubmodule: null,
          submodules: null,
          isLoadingSubmodule: false,
          githubRepoInfo: null,
          commitGitHubInfo: new Map<string, CommitGitHubInfo>(),
        });

        get().fetchSubmodules();
        get().fetchGitHubRepoInfo();
      })
      .catch((error) => {
        set({ submoduleError: (error as Error).message, isLoadingSubmodule: false });
      });
  },
}));
