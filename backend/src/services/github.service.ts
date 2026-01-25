// GitHub API service for fetching PR and issue information
import chalk from 'chalk';

// Progress callback type for streaming updates
export type ProgressCallback = (step: string, status: 'start' | 'success' | 'error' | 'info', message: string, data?: any) => void;

// Logger for GitHub operations
const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), chalk.gray('[GitHub]'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), chalk.gray('[GitHub]'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), chalk.gray('[GitHub]'), msg),
  error: (msg: string) => console.log(chalk.red('✗'), chalk.gray('[GitHub]'), msg),
  debug: (msg: string) => console.log(chalk.magenta('●'), chalk.gray('[GitHub]'), chalk.dim(msg)),
};

export interface GitHubConfig {
  token?: string;
}

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

// Simple LRU cache for API responses
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number = 1000, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

class GitHubService {
  private config: GitHubConfig = {};
  private prCache = new LRUCache<PullRequest[]>();
  private issueCache = new LRUCache<Issue>();

  setToken(token: string | null): void {
    if (token) {
      this.config.token = token;
    } else {
      delete this.config.token;
    }
  }

  getToken(): string | undefined {
    return this.config.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  /**
   * Parse GitHub owner/repo from a remote URL
   */
  parseRemoteUrl(url: string): GitHubRepoInfo | null {
    // Handle various GitHub URL formats
    const patterns = [
      // HTTPS: https://github.com/owner/repo.git or https://github.com/owner/repo
      /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
      // SSH: git@github.com:owner/repo.git or git@github.com:owner/repo
      /^git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
      // Git protocol: git://github.com/owner/repo.git
      /^git:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2],
          isGitHub: true,
        };
      }
    }

    return null;
  }

  /**
   * Fetch with error handling and rate limit awareness
   */
  private async fetchGitHub<T>(url: string, description?: string): Promise<T | null> {
    const shortUrl = url.replace('https://api.github.com/', '');
    log.debug(`Fetching: ${shortUrl}`);
    const startTime = Date.now();

    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      const elapsed = Date.now() - startTime;

      // Log rate limit info
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      if (remaining && limit) {
        const pct = Math.round((parseInt(remaining) / parseInt(limit)) * 100);
        log.debug(`Rate limit: ${remaining}/${limit} (${pct}%) remaining`);
      }

      if (response.status === 401) {
        log.error('Authentication failed - invalid token');
        throw new Error('GitHub authentication failed. Please check your token.');
      }

      if (response.status === 403) {
        if (remaining === '0') {
          const reset = response.headers.get('X-RateLimit-Reset');
          const resetDate = reset ? new Date(parseInt(reset) * 1000).toLocaleTimeString() : 'soon';
          log.error(`Rate limit exceeded! Resets at ${resetDate}`);
          throw new Error(`GitHub rate limit exceeded. Resets at ${resetDate}.`);
        }
        log.error('Access forbidden');
        throw new Error('GitHub access forbidden.');
      }

      if (response.status === 404) {
        log.debug(`Not found: ${shortUrl} (${elapsed}ms)`);
        return null;
      }

      if (!response.ok) {
        log.error(`API error ${response.status}: ${shortUrl}`);
        throw new Error(`GitHub API error: ${response.status}`);
      }

      log.debug(`Fetched: ${shortUrl} (${elapsed}ms)`);
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        log.error('Network error - cannot reach GitHub API');
        throw new Error('Network error: Unable to reach GitHub API');
      }
      throw error;
    }
  }

  /**
   * Get pull requests that contain a specific commit
   */
  async getPullRequestsForCommit(
    owner: string,
    repo: string,
    commitSha: string
  ): Promise<PullRequest[]> {
    const cacheKey = `${owner}/${repo}/${commitSha}`;
    const cached = this.prCache.get(cacheKey);
    if (cached) return cached;

    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}/pulls`;
    const data = await this.fetchGitHub<any[]>(url);

    if (!data) return [];

    const prs: PullRequest[] = data.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      state: pr.merged_at ? 'merged' : (pr.state as 'open' | 'closed'),
      url: pr.html_url,
      author: pr.user?.login || 'unknown',
      createdAt: pr.created_at,
      mergedAt: pr.merged_at || undefined,
    }));

    this.prCache.set(cacheKey, prs);
    return prs;
  }

  /**
   * Parse issue references from commit message and body
   * Supports: fixes #123, closes #456, resolves #789, etc.
   */
  parseIssueReferences(message: string, body: string = ''): number[] {
    const text = `${message}\n${body}`;
    const patterns = [
      // Standard GitHub keywords
      /(?:fix(?:es|ed)?|close[sd]?|resolve[sd]?)\s*#(\d+)/gi,
      // Simple #number references
      /(?:^|\s)#(\d+)(?:\s|$|[,.])/gm,
    ];

    const issues = new Set<number>();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.add(parseInt(match[1], 10));
      }
    }

    return Array.from(issues).sort((a, b) => a - b);
  }

  /**
   * Fetch issue details
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue | null> {
    const cacheKey = `${owner}/${repo}/issue/${issueNumber}`;
    const cached = this.issueCache.get(cacheKey);
    if (cached) return cached;

    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
    const data = await this.fetchGitHub<any>(url);

    if (!data) return null;

    // Skip pull requests (GitHub API returns PRs as issues too)
    if (data.pull_request) return null;

    const issue: Issue = {
      number: data.number,
      title: data.title,
      state: data.state as 'open' | 'closed',
      url: data.html_url,
      labels: data.labels?.map((l: any) => l.name) || [],
    };

    this.issueCache.set(cacheKey, issue);
    return issue;
  }

  /**
   * Get combined GitHub info for a commit (with optional progress callback)
   */
  async getCommitGitHubInfo(
    owner: string,
    repo: string,
    commit: { hash: string; message: string; body: string },
    onProgress?: ProgressCallback
  ): Promise<CommitGitHubInfo> {
    const shortHash = commit.hash.substring(0, 7);
    log.info(`Fetching GitHub info for commit ${shortHash}`);
    onProgress?.('init', 'start', `Starting GitHub lookup for ${shortHash}...`);

    // Step 1: Fetch pull requests
    onProgress?.('prs', 'start', 'Searching for pull requests...');
    log.debug(`Looking up PRs for ${owner}/${repo}@${shortHash}`);

    let pullRequests: PullRequest[] = [];
    try {
      pullRequests = await this.getPullRequestsForCommit(owner, repo, commit.hash);
      if (pullRequests.length > 0) {
        log.success(`Found ${pullRequests.length} PR(s) for commit ${shortHash}`);
        onProgress?.('prs', 'success', `Found ${pullRequests.length} pull request(s)`, { count: pullRequests.length });
      } else {
        log.info(`No PRs found for commit ${shortHash}`);
        onProgress?.('prs', 'info', 'No pull requests found');
      }
    } catch (err) {
      log.error(`Failed to fetch PRs: ${err}`);
      onProgress?.('prs', 'error', `Failed to fetch PRs: ${err}`);
    }

    // Step 2: Parse issue references
    onProgress?.('parse', 'start', 'Parsing commit message for issue references...');
    const issueNumbers = this.parseIssueReferences(commit.message, commit.body);
    if (issueNumbers.length > 0) {
      log.info(`Found ${issueNumbers.length} issue reference(s): #${issueNumbers.join(', #')}`);
      onProgress?.('parse', 'success', `Found ${issueNumbers.length} issue reference(s): #${issueNumbers.join(', #')}`, { issues: issueNumbers });
    } else {
      log.debug('No issue references found in commit message');
      onProgress?.('parse', 'info', 'No issue references in commit message');
    }

    // Step 3: Fetch issue details
    const linkedIssues: Issue[] = [];
    if (issueNumbers.length > 0) {
      onProgress?.('issues', 'start', `Fetching details for ${issueNumbers.length} issue(s)...`);

      for (let i = 0; i < issueNumbers.length; i++) {
        const issueNum = issueNumbers[i];
        onProgress?.('issues', 'info', `Fetching issue #${issueNum} (${i + 1}/${issueNumbers.length})...`, { current: i + 1, total: issueNumbers.length });

        try {
          const issue = await this.getIssue(owner, repo, issueNum);
          if (issue) {
            linkedIssues.push(issue);
            log.success(`Fetched issue #${issueNum}: "${issue.title.substring(0, 40)}..."`);
          }
        } catch (err) {
          log.warn(`Could not fetch issue #${issueNum}: ${err}`);
        }
      }

      onProgress?.('issues', 'success', `Loaded ${linkedIssues.length} issue(s)`, { count: linkedIssues.length });
    }

    // Complete
    log.success(`GitHub lookup complete: ${pullRequests.length} PR(s), ${linkedIssues.length} issue(s)`);
    onProgress?.('complete', 'success', 'GitHub info loaded', {
      pullRequests: pullRequests.length,
      linkedIssues: linkedIssues.length
    });

    return { pullRequests, linkedIssues };
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{ remaining: number; limit: number; resetAt: string } | null> {
    try {
      const url = 'https://api.github.com/rate_limit';
      const data = await this.fetchGitHub<any>(url);
      if (!data) return null;

      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        resetAt: new Date(data.rate.reset * 1000).toISOString(),
      };
    } catch {
      return null;
    }
  }
}

export const githubService = new GitHubService();
