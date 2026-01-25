import type {
  LoadRepositoryResponse,
  Repository,
  StatsResponse,
  MetadataResponse,
  CommitsResponse,
  RepoStats,
  RepositoryMetadata,
  Commit,
  PaginatedCommits,
  DiffStats,
  DiffStatsResponse,
  FileDiffDetail,
  FileDiffResponse,
  TreeEntry,
  TreeResponse,
  FileContent,
  FileContentResponse,
  ContributorStats,
  ContributorStatsResponse,
  ActivityDay,
  ActivityResponse,
  Submodule,
  SubmodulesResponse,
  DateRange,
  BranchComparison,
  BranchComparisonResponse,
  FileChurnStats,
  CodeChurnResponse,
  FileBusFactor,
  BusFactorResponse,
  CommitPatterns,
  CommitPatternsResponse,
  BranchLifespan,
  BranchLifespanResponse,
} from '../types';

const API_BASE = '/api';

// Get repository stats (fast - just commit count)
export async function getRepoStats(path: string): Promise<RepoStats> {
  const response = await fetch(`${API_BASE}/repository/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  const data: StatsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get repository stats');
  }

  return data.data!;
}

// Get repository metadata (branches, tags, stats) without commits
export async function getRepoMetadata(path: string): Promise<RepositoryMetadata> {
  const response = await fetch(`${API_BASE}/repository/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  const data: MetadataResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get repository metadata');
  }

  return data.data!;
}

// Get paginated commits
export async function getCommitsPaginated(
  path: string,
  options: { maxCount?: number; skip?: number; firstParent?: boolean; dateRange?: DateRange; branch?: string; authors?: string[] } = {}
): Promise<PaginatedCommits> {
  const { maxCount = 500, skip = 0, firstParent = false, dateRange, branch, authors } = options;
  const params = new URLSearchParams({
    maxCount: maxCount.toString(),
    skip: skip.toString(),
    firstParent: firstParent.toString(),
  });

  // Add date range filters if provided
  if (dateRange?.since) {
    params.set('since', dateRange.since);
  }
  if (dateRange?.until) {
    params.set('until', dateRange.until);
  }

  // Add branch filter if provided
  if (branch) {
    params.set('branch', branch);
  }

  // Add author filters if provided
  if (authors && authors.length > 0) {
    params.set('authors', authors.join(','));
  }

  const response = await fetch(`${API_BASE}/repository/commits?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  const data: CommitsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get commits');
  }

  return data.data!;
}

// Stream commits using Server-Sent Events
export interface StreamCallbacks {
  onMetadata: (metadata: RepositoryMetadata) => void;
  onCommits: (commits: Commit[], progress: number, total: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export function streamRepository(
  path: string,
  callbacks: StreamCallbacks,
  options: { chunkSize?: number; firstParent?: boolean } = {}
): () => void {
  const { chunkSize = 500, firstParent = false } = options;
  const params = new URLSearchParams({
    chunkSize: chunkSize.toString(),
    firstParent: firstParent.toString(),
  });

  // Use fetch with streaming for SSE over POST
  const controller = new AbortController();

  fetch(`${API_BASE}/repository/stream?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to stream repository');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6);

            if (eventType && eventData) {
              try {
                const parsed = JSON.parse(eventData);

                switch (eventType) {
                  case 'metadata':
                    callbacks.onMetadata(parsed);
                    break;
                  case 'commits':
                    callbacks.onCommits(parsed.commits, parsed.progress, parsed.total);
                    break;
                  case 'complete':
                    callbacks.onComplete();
                    break;
                  case 'error':
                    callbacks.onError(new Error(parsed.error));
                    break;
                }
              } catch {
                // Ignore parse errors
              }
              eventType = '';
              eventData = '';
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        callbacks.onError(error);
      }
    });

  // Return abort function
  return () => controller.abort();
}

// Legacy: Load full repository (for small repos)
export async function loadRepository(path: string): Promise<Repository> {
  const response = await fetch(`${API_BASE}/repository/load`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  const data: LoadRepositoryResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to load repository');
  }

  return data.data!;
}

export async function validateRepository(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/repository/validate?repoPath=${encodeURIComponent(path)}`);
    const data = await response.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

export function isGitUrl(input: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/,
    /^https?:\/\/(www\.)?gitlab\.com\/[\w.-]+\/[\w.-]+/,
    /^https?:\/\/(www\.)?bitbucket\.org\/[\w.-]+\/[\w.-]+/,
    /^git@github\.com:[\w.-]+\/[\w.-]+/,
    /^git@gitlab\.com:[\w.-]+\/[\w.-]+/,
    /^https?:\/\/.*\.git$/,
    /^git:\/\/.*/,
  ];
  return patterns.some((pattern) => pattern.test(input.trim()));
}

// Custom error class for authentication required errors
export class AuthRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export async function cloneRepository(
  url: string,
  options: { shallow?: boolean; token?: string } = {}
): Promise<Repository> {
  const { shallow = true, token } = options;

  const response = await fetch(`${API_BASE}/repository/clone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, shallow, token }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    // Check if this is an auth error
    if (response.status === 401 || data.authRequired) {
      throw new AuthRequiredError(
        'This repository requires authentication. Please provide a personal access token.'
      );
    }
    throw new Error(data.error || 'Failed to clone repository');
  }

  return data.data!;
}

export async function uploadRepository(file: File): Promise<Repository> {
  const formData = new FormData();
  formData.append('gitZip', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data: LoadRepositoryResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload repository');
  }

  return data.data!;
}

// Essential .git files/paths needed for visualization
// Skips: hooks/, logs/, index, info/, description, temp files, lock files
const ESSENTIAL_GIT_PATTERNS = [
  // With .git/ prefix (when selecting parent folder)
  /\.git\/HEAD$/,
  /\.git\/config$/,
  /\.git\/packed-refs$/,
  /\.git\/objects\//,
  /\.git\/refs\/heads\//,
  /\.git\/refs\/tags\//,
  /\.git\/refs\/remotes\//,
  // Without .git/ prefix (when selecting .git folder directly)
  /^HEAD$/,
  /^config$/,
  /^packed-refs$/,
  /^objects\//,
  /^refs\/heads\//,
  /^refs\/tags\//,
  /^refs\/remotes\//,
];

// Paths to skip (even if they match above)
const SKIP_PATTERNS = [
  /hooks\//,
  /logs\//,
  /info\//,
  /\.lock$/,
  /COMMIT_EDITMSG/,
  /FETCH_HEAD/,
  /ORIG_HEAD/,
  /description$/,
  /^index$/,
  /\.git\/index$/,
];

function isEssentialGitFile(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');

  // Skip non-essential files
  if (SKIP_PATTERNS.some((p) => p.test(normalized))) {
    return false;
  }

  // Must be in .git folder or be a .git file directly
  const isGitRelated = normalized.includes('.git/') ||
    normalized.startsWith('objects/') ||
    normalized.startsWith('refs/') ||
    normalized === 'HEAD' ||
    normalized === 'config' ||
    normalized === 'packed-refs' ||
    /^\.git\//.test(normalized);

  if (!isGitRelated) return false;

  return ESSENTIAL_GIT_PATTERNS.some((p) => p.test(normalized));
}

export async function uploadFolder(files: FileList): Promise<Repository> {
  const formData = new FormData();
  let fileCount = 0;

  // Only upload essential .git files (skip hooks, logs, index, etc.)
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = (file as any).webkitRelativePath || file.name;

    if (isEssentialGitFile(relativePath)) {
      formData.append('files', file, relativePath);
      fileCount++;
    }
  }

  if (fileCount === 0) {
    throw new Error('No .git folder found or no essential git files in the selected directory');
  }

  const response = await fetch(`${API_BASE}/upload-folder`, {
    method: 'POST',
    body: formData,
  });

  const data: LoadRepositoryResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload folder');
  }

  return data.data!;
}

// Diff APIs

export async function getCommitDiffStats(
  repoPath: string,
  commitHash: string
): Promise<DiffStats> {
  const response = await fetch(`${API_BASE}/commit/${commitHash}/diff-stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: DiffStatsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get diff stats');
  }

  return data.data!;
}

export async function getCommitFileDiff(
  repoPath: string,
  commitHash: string,
  filePath: string
): Promise<FileDiffDetail> {
  const params = new URLSearchParams({ filePath });
  const response = await fetch(
    `${API_BASE}/commit/${commitHash}/file-diff?${params}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: repoPath }),
    }
  );

  const data: FileDiffResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get file diff');
  }

  return data.data!;
}

// File tree APIs

export async function getFileTree(
  repoPath: string,
  commitHash: string,
  treePath?: string
): Promise<TreeEntry[]> {
  const params = treePath ? new URLSearchParams({ treePath }) : '';
  const response = await fetch(
    `${API_BASE}/commit/${commitHash}/tree${params ? `?${params}` : ''}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: repoPath }),
    }
  );

  const data: TreeResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get file tree');
  }

  return data.data!;
}

export async function getFileContent(
  repoPath: string,
  commitHash: string,
  filePath: string
): Promise<FileContent> {
  const params = new URLSearchParams({ filePath });
  const response = await fetch(
    `${API_BASE}/commit/${commitHash}/file?${params}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: repoPath }),
    }
  );

  const data: FileContentResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get file content');
  }

  return data.data!;
}

// Stats APIs

export async function getContributorStats(
  repoPath: string
): Promise<ContributorStats[]> {
  const response = await fetch(`${API_BASE}/repository/contributors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: ContributorStatsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get contributor stats');
  }

  return data.data!;
}

export async function getActivityHeatmap(
  repoPath: string,
  days: number = 365
): Promise<ActivityDay[]> {
  const params = new URLSearchParams({ days: days.toString() });
  const response = await fetch(`${API_BASE}/repository/activity?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: ActivityResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get activity heatmap');
  }

  return data.data!;
}

// Submodule APIs

export async function getSubmodules(repoPath: string): Promise<Submodule[]> {
  const response = await fetch(`${API_BASE}/repository/submodules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: SubmodulesResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get submodules');
  }

  return data.data!;
}

export async function loadSubmoduleRepository(
  repoPath: string,
  submodulePath: string
): Promise<Repository> {
  const response = await fetch(`${API_BASE}/repository/submodules/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath, submodulePath }),
  });

  const data: LoadRepositoryResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to load submodule');
  }

  return data.data!;
}

// Branch comparison API

export async function compareBranches(
  repoPath: string,
  baseBranch: string,
  compareBranch: string
): Promise<BranchComparison> {
  const response = await fetch(`${API_BASE}/repository/branch-compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath, baseBranch, compareBranch }),
  });

  const data: BranchComparisonResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to compare branches');
  }

  return data.data!;
}

// Analytics APIs

export async function getCodeChurn(
  repoPath: string,
  limit: number = 50
): Promise<FileChurnStats[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${API_BASE}/repository/code-churn?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: CodeChurnResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get code churn');
  }

  return data.data!;
}

export async function getBusFactor(
  repoPath: string,
  minCommits: number = 5
): Promise<FileBusFactor[]> {
  const params = new URLSearchParams({ minCommits: minCommits.toString() });
  const response = await fetch(`${API_BASE}/repository/bus-factor?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: BusFactorResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get bus factor');
  }

  return data.data!;
}

export async function getCommitPatterns(
  repoPath: string
): Promise<CommitPatterns> {
  const response = await fetch(`${API_BASE}/repository/commit-patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: CommitPatternsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get commit patterns');
  }

  return data.data!;
}

export async function getBranchLifespans(
  repoPath: string
): Promise<BranchLifespan[]> {
  const response = await fetch(`${API_BASE}/repository/branch-lifespans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });

  const data: BranchLifespanResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get branch lifespans');
  }

  return data.data!;
}
