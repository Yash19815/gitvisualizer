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
