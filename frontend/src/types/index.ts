export interface Author {
  name: string;
  email: string;
}

export interface RefInfo {
  name: string;
  type: 'branch' | 'tag' | 'remote';
  isHead: boolean;
}

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  body: string;
  author: Author;
  date: string;
  parents: string[];
  refs: RefInfo[];
}

export interface Branch {
  name: string;
  commit: string;
  isRemote: boolean;
  isHead: boolean;
}

export interface Tag {
  name: string;
  commit: string;
}

export interface RepoStats {
  totalCommits: number;
  isLargeRepo: boolean;
  recommendedMode: 'full' | 'paginated' | 'simplified';
}

export interface RepositoryMetadata {
  path: string;
  name: string;
  currentBranch: string;
  branches: Branch[];
  tags: Tag[];
  stats: RepoStats;
}

export interface Repository {
  path: string;
  name: string;
  currentBranch: string;
  commits: Commit[];
  branches: Branch[];
  tags: Tag[];
  stats?: RepoStats;
  loadedCommitCount?: number;
  totalCommitCount?: number;
}

export interface PaginatedCommits {
  commits: Commit[];
  total: number;
  hasMore: boolean;
}

export interface LoadRepositoryResponse {
  success: boolean;
  data?: Repository;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data?: RepoStats;
  error?: string;
}

export interface MetadataResponse {
  success: boolean;
  data?: RepositoryMetadata;
  error?: string;
}

export interface CommitsResponse {
  success: boolean;
  data?: PaginatedCommits;
  error?: string;
}

// Diff types
export interface FileDiff {
  path: string;
  oldPath?: string;
  status: 'added' | 'deleted' | 'modified' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  binary: boolean;
}

export interface DiffStats {
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface FileDiffDetail extends FileDiff {
  hunks: DiffHunk[];
}

// File tree types
export interface TreeEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  binary: boolean;
}

// API response types for new features
export interface DiffStatsResponse {
  success: boolean;
  data?: DiffStats;
  error?: string;
}

export interface FileDiffResponse {
  success: boolean;
  data?: FileDiffDetail;
  error?: string;
}

export interface TreeResponse {
  success: boolean;
  data?: TreeEntry[];
  error?: string;
}

export interface FileContentResponse {
  success: boolean;
  data?: FileContent;
  error?: string;
}

// Contributor stats types
export interface ContributorStats {
  name: string;
  email: string;
  commitCount: number;
  additions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ContributorStatsResponse {
  success: boolean;
  data?: ContributorStats[];
  error?: string;
}

export interface ActivityResponse {
  success: boolean;
  data?: ActivityDay[];
  error?: string;
}

// Submodule types
export interface Submodule {
  name: string;
  path: string;
  url: string;
  currentCommit: string;
  initialized: boolean;
}

export interface SubmodulesResponse {
  success: boolean;
  data?: Submodule[];
  error?: string;
}

// Date range filter types
export interface DateRange {
  since?: string; // ISO date string
  until?: string; // ISO date string
}

// Branch comparison types
export interface BranchComparison {
  baseBranch: string;
  compareBranch: string;
  aheadCount: number;
  behindCount: number;
  aheadCommits: Commit[];
  behindCommits: Commit[];
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface BranchComparisonResponse {
  success: boolean;
  data?: BranchComparison;
  error?: string;
}

// GitHub API types
export interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  url: string;
  author: string;
  createdAt: string;
  mergedAt?: string;
}

export interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  url: string;
  labels: string[];
}

export interface CommitGitHubInfo {
  pullRequests: PullRequest[];
  linkedIssues: Issue[];
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  isGitHub: boolean;
}

export interface GitHubInfoResponse {
  success: boolean;
  data?: CommitGitHubInfo;
  error?: string;
  warning?: string;
}

export interface GitHubRepoInfoResponse {
  success: boolean;
  data?: GitHubRepoInfo;
  error?: string;
}

export interface GitHubRateLimitResponse {
  success: boolean;
  data?: {
    remaining: number;
    limit: number;
    resetAt: string;
  };
  error?: string;
}

// Submodule graph types
export interface SubmoduleNodeData {
  submodule: Submodule;
  color: string;
  isCompact: boolean;
}

// Repository navigation stack for submodule traversal
export interface RepositoryStackItem {
  path: string;
  name: string;
}

// Code Churn Analysis Types
export interface FileChurnStats {
  path: string;
  changeCount: number;
  totalAdditions: number;
  totalDeletions: number;
  authors: string[];
  lastModified: string;
  churnScore: number;
}

export interface CodeChurnResponse {
  success: boolean;
  data?: FileChurnStats[];
  error?: string;
}

// Bus Factor Types
export interface FileBusFactor {
  path: string;
  primaryAuthor: {
    name: string;
    email: string;
    percentage: number;
  };
  totalCommits: number;
  uniqueContributors: number;
  busFactor: number;
  contributors: {
    name: string;
    email: string;
    commits: number;
    percentage: number;
  }[];
}

export interface BusFactorResponse {
  success: boolean;
  data?: FileBusFactor[];
  error?: string;
}

// Commit Patterns Types
export interface CommitPatternCell {
  hour: number;      // 0-23
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  count: number;
}

export interface CommitPatterns {
  hourlyDistribution: CommitPatternCell[];
  peakHour: number;
  peakDay: number;
  totalCommits: number;
}

export interface CommitPatternsResponse {
  success: boolean;
  data?: CommitPatterns;
  error?: string;
}

// Branch Lifespan Types
export interface BranchLifespan {
  branchName: string;
  createdAt: string;
  mergedAt: string | null;
  lifespanDays: number | null;
  status: 'active' | 'merged' | 'stale';
  commitCount: number;
}

export interface BranchLifespanResponse {
  success: boolean;
  data?: BranchLifespan[];
  error?: string;
}
