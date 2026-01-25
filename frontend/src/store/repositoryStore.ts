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
} from '../api/gitApi';

export type LoadMode = 'full' | 'paginated' | 'simplified';
export type DetailTab = 'details' | 'changes' | 'files';

interface RepositoryState {
  repository: Repository | null;
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
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repository: null,
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
        set({
          repository: {
            ...repository,
            loadedCommitCount: repository.commits.length,
            totalCommitCount: repository.commits.length,
          },
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
              set({
                isLoading: false,
                loadingProgress: 100,
                loadingMessage: '',
                abortStream: null,
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

      set((state) => ({
        repository: state.repository
          ? {
              ...state.repository,
              commits: [...state.repository.commits, ...result.commits],
              loadedCommitCount: state.repository.commits.length + result.commits.length,
            }
          : null,
        isLoading: false,
        loadingMessage: '',
      }));
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

  setSelectedCommit: (commit) =>
    set({
      selectedCommit: commit,
      // Clear diff and file state when changing commits
      diffStats: null,
      selectedFileDiff: null,
      diffError: null,
      fileTree: [],
      expandedPaths: new Set<string>(),
      selectedFile: null,
      fileError: null,
      activeTab: 'details',
    }),

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
}));
