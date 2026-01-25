import simpleGit, { SimpleGit } from 'simple-git';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

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

export interface Repository {
  path: string;
  name: string;
  currentBranch: string;
  commits: Commit[];
  branches: Branch[];
  tags: Tag[];
}

export interface PaginationOptions {
  maxCount?: number; // Default: 500
  skip?: number; // Offset for pagination
  firstParent?: boolean; // Only follow first parent (simplified view)
}

export interface PaginatedCommits {
  commits: Commit[];
  total: number;
  hasMore: boolean;
}

export interface RepoStats {
  totalCommits: number;
  isLargeRepo: boolean; // > 10,000 commits
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

function parseRefs(refsString: string): RefInfo[] {
  if (!refsString || refsString.trim() === '') return [];

  const refs: RefInfo[] = [];
  const parts = refsString.split(',').map(s => s.trim());

  for (const part of parts) {
    if (part.startsWith('HEAD -> ')) {
      refs.push({
        name: part.replace('HEAD -> ', ''),
        type: 'branch',
        isHead: true,
      });
    } else if (part === 'HEAD') {
      continue;
    } else if (part.startsWith('tag: ')) {
      refs.push({
        name: part.replace('tag: ', ''),
        type: 'tag',
        isHead: false,
      });
    } else if (part.startsWith('origin/')) {
      refs.push({
        name: part,
        type: 'remote',
        isHead: false,
      });
    } else if (part) {
      refs.push({
        name: part,
        type: 'branch',
        isHead: false,
      });
    }
  }

  return refs;
}

class GitService {
  private getGit(repoPath: string): SimpleGit {
    return simpleGit(repoPath);
  }

  async validateRepository(repoPath: string): Promise<boolean> {
    try {
      const git = this.getGit(repoPath);
      return await git.checkIsRepo();
    } catch {
      return false;
    }
  }

  validateGitUrl(url: string): boolean {
    // Support GitHub, GitLab, Bitbucket, and generic git URLs
    const patterns = [
      /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/,
      /^https?:\/\/(www\.)?gitlab\.com\/[\w.-]+\/[\w.-]+/,
      /^https?:\/\/(www\.)?bitbucket\.org\/[\w.-]+\/[\w.-]+/,
      /^git@github\.com:[\w.-]+\/[\w.-]+/,
      /^git@gitlab\.com:[\w.-]+\/[\w.-]+/,
      /^https?:\/\/.*\.git$/,
      /^git:\/\/.*/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  }

  extractRepoName(url: string): string {
    // Extract repo name from URL
    const match = url.match(/\/([^\/]+?)(\.git)?$/);
    return match ? match[1].replace('.git', '') : 'repository';
  }

  async cloneRepository(
    url: string,
    options: { shallow?: boolean; depth?: number } = {}
  ): Promise<string> {
    if (!this.validateGitUrl(url)) {
      throw new Error('Invalid git repository URL');
    }

    const { shallow = true, depth = 500 } = options;

    const repoName = this.extractRepoName(url);
    const tempDir = path.join(os.tmpdir(), `gitvis-${repoName}-${Date.now()}`);

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    const git = simpleGit();

    try {
      const cloneArgs: string[] = ['--no-single-branch']; // Fetch all branches, not just default

      if (shallow) {
        cloneArgs.push('--depth', depth.toString());
      }

      await git.clone(url, tempDir, cloneArgs);

      return tempDir;
    } catch (error) {
      // Clean up on failure
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw new Error(`Failed to clone repository: ${(error as Error).message}`);
    }
  }

  async cleanupRepository(repoPath: string): Promise<void> {
    // Only clean up temp directories
    if (repoPath.startsWith(os.tmpdir())) {
      await fs.rm(repoPath, { recursive: true, force: true }).catch(() => {});
    }
  }

  async getRepository(repoPath: string): Promise<Repository> {
    const git = this.getGit(repoPath);

    const [commits, branches, tags, currentBranch] = await Promise.all([
      this.getCommits(git),
      this.getBranches(git),
      this.getTags(git),
      this.getCurrentBranch(git),
    ]);

    const name = repoPath.split('/').filter(Boolean).pop() || 'repository';

    return {
      path: repoPath,
      name,
      currentBranch,
      commits,
      branches,
      tags,
    };
  }

  async getRepoStats(repoPath: string): Promise<RepoStats> {
    const git = this.getGit(repoPath);
    const totalCommits = await this.getTotalCommitCount(git);

    const LARGE_REPO_THRESHOLD = 10000;
    const HUGE_REPO_THRESHOLD = 100000;

    let recommendedMode: 'full' | 'paginated' | 'simplified' = 'full';
    if (totalCommits > HUGE_REPO_THRESHOLD) {
      recommendedMode = 'simplified';
    } else if (totalCommits > LARGE_REPO_THRESHOLD) {
      recommendedMode = 'paginated';
    }

    return {
      totalCommits,
      isLargeRepo: totalCommits > LARGE_REPO_THRESHOLD,
      recommendedMode,
    };
  }

  async getRepositoryMetadata(repoPath: string): Promise<RepositoryMetadata> {
    const git = this.getGit(repoPath);

    const [branches, tags, currentBranch, stats] = await Promise.all([
      this.getBranches(git),
      this.getTags(git),
      this.getCurrentBranch(git),
      this.getRepoStats(repoPath),
    ]);

    const name = repoPath.split('/').filter(Boolean).pop() || 'repository';

    return {
      path: repoPath,
      name,
      currentBranch,
      branches,
      tags,
      stats,
    };
  }

  private async getCommits(git: SimpleGit): Promise<Commit[]> {
    const log = await git.log({
      '--all': null,
      '--date-order': null,
      format: {
        hash: '%H',
        shortHash: '%h',
        message: '%s',
        body: '%b',
        authorName: '%an',
        authorEmail: '%ae',
        date: '%aI',
        parents: '%P',
        refs: '%D',
      },
    });

    return log.all.map((entry) => ({
      hash: entry.hash,
      shortHash: entry.shortHash,
      message: entry.message,
      body: entry.body,
      author: {
        name: entry.authorName,
        email: entry.authorEmail,
      },
      date: entry.date,
      parents: entry.parents ? entry.parents.split(' ').filter(Boolean) : [],
      refs: parseRefs(entry.refs),
    }));
  }

  private async getBranches(git: SimpleGit): Promise<Branch[]> {
    const result = await git.branch(['-a', '-v']);
    const branches: Branch[] = [];

    for (const [name, data] of Object.entries(result.branches)) {
      branches.push({
        name: data.name,
        commit: data.commit,
        isRemote: name.startsWith('remotes/'),
        isHead: data.current,
      });
    }

    return branches;
  }

  private async getTags(git: SimpleGit): Promise<Tag[]> {
    try {
      // Use show-ref --tags for O(1) instead of O(N) revparse calls
      const result = await git.raw(['show-ref', '--tags']);
      return result
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [commit, ref] = line.split(' ');
          return {
            name: ref.replace('refs/tags/', ''),
            commit,
          };
        });
    } catch {
      // No tags or error - return empty array
      return [];
    }
  }

  private async getCurrentBranch(git: SimpleGit): Promise<string> {
    try {
      const result = await git.revparse(['--abbrev-ref', 'HEAD']);
      return result.trim();
    } catch {
      return 'HEAD';
    }
  }

  private async getTotalCommitCount(git: SimpleGit): Promise<number> {
    try {
      const result = await git.raw(['rev-list', '--all', '--count']);
      return parseInt(result.trim(), 10);
    } catch {
      return 0;
    }
  }

  async getCommitsPaginated(
    repoPath: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedCommits> {
    const git = this.getGit(repoPath);
    const { maxCount = 500, skip = 0, firstParent = false } = options;

    const format = {
      hash: '%H',
      shortHash: '%h',
      message: '%s',
      body: '%b',
      authorName: '%an',
      authorEmail: '%ae',
      date: '%aI',
      parents: '%P',
      refs: '%D',
    };

    type LogEntry = {
      hash: string;
      shortHash: string;
      message: string;
      body: string;
      authorName: string;
      authorEmail: string;
      date: string;
      parents: string;
      refs: string;
    };

    // First-parent mode significantly reduces commits for complex histories
    const logOptions = firstParent
      ? {
          '--all': null,
          '--date-order': null,
          '--first-parent': null,
          maxCount: maxCount + 1,
          '--skip': skip,
          format,
        }
      : {
          '--all': null,
          '--date-order': null,
          maxCount: maxCount + 1,
          '--skip': skip,
          format,
        };

    const [log, total] = await Promise.all([
      git.log(logOptions),
      this.getTotalCommitCount(git),
    ]);

    const hasMore = log.all.length > maxCount;
    const commits = (log.all as unknown as LogEntry[]).slice(0, maxCount).map((entry) => ({
      hash: entry.hash,
      shortHash: entry.shortHash,
      message: entry.message,
      body: entry.body,
      author: {
        name: entry.authorName,
        email: entry.authorEmail,
      },
      date: entry.date,
      parents: entry.parents ? entry.parents.split(' ').filter(Boolean) : [],
      refs: parseRefs(entry.refs),
    }));

    return { commits, total, hasMore };
  }

  // Generator for streaming commits in chunks
  async *streamCommits(
    repoPath: string,
    options: { chunkSize?: number; firstParent?: boolean } = {}
  ): AsyncGenerator<{ commits: Commit[]; progress: number; total: number }> {
    const git = this.getGit(repoPath);
    const { chunkSize = 500, firstParent = false } = options;
    const total = await this.getTotalCommitCount(git);

    let skip = 0;
    while (true) {
      const result = await this.getCommitsPaginated(repoPath, {
        maxCount: chunkSize,
        skip,
        firstParent,
      });

      yield {
        commits: result.commits,
        progress: Math.min(100, Math.round(((skip + result.commits.length) / total) * 100)),
        total,
      };

      if (!result.hasMore || result.commits.length === 0) {
        break;
      }
      skip += chunkSize;
    }
  }

  async getCommitDetails(repoPath: string, hash: string): Promise<Commit | null> {
    const git = this.getGit(repoPath);

    try {
      const log = await git.log({
        from: hash,
        to: hash,
        format: {
          hash: '%H',
          shortHash: '%h',
          message: '%s',
          body: '%b',
          authorName: '%an',
          authorEmail: '%ae',
          date: '%aI',
          parents: '%P',
          refs: '%D',
        },
        '-1': null,
      });

      if (log.all.length === 0) return null;

      const entry = log.all[0];
      return {
        hash: entry.hash,
        shortHash: entry.shortHash,
        message: entry.message,
        body: entry.body,
        author: {
          name: entry.authorName,
          email: entry.authorEmail,
        },
        date: entry.date,
        parents: entry.parents ? entry.parents.split(' ').filter(Boolean) : [],
        refs: parseRefs(entry.refs),
      };
    } catch {
      return null;
    }
  }
}

export const gitService = new GitService();
