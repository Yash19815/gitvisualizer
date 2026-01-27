import simpleGit, { SimpleGit } from "simple-git";
import os from "os";
import path from "path";
import fs from "fs/promises";

export interface Author {
  name: string;
  email: string;
}

export interface RefInfo {
  name: string;
  type: "branch" | "tag" | "remote";
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
  since?: string; // ISO date string for --since filter
  until?: string; // ISO date string for --until filter
  branch?: string; // Filter commits by specific branch
  authors?: string[]; // Filter commits by specific author emails
}

export interface PaginatedCommits {
  commits: Commit[];
  total: number;
  hasMore: boolean;
}

export interface RepoStats {
  totalCommits: number;
  isLargeRepo: boolean; // > 10,000 commits
  recommendedMode: "full" | "paginated" | "simplified";
}

export interface RepositoryMetadata {
  path: string;
  name: string;
  currentBranch: string;
  branches: Branch[];
  tags: Tag[];
  stats: RepoStats;
}

// Diff-related interfaces
export interface FileDiff {
  path: string;
  oldPath?: string;
  status: "added" | "deleted" | "modified" | "renamed" | "copied";
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

// File tree interfaces
export interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  binary: boolean;
}

// Contributor stats interfaces
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

// Submodule interfaces
export interface Submodule {
  name: string;
  path: string;
  url: string;
  currentCommit: string;
  initialized: boolean;
}

// Branch comparison interfaces
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

// Code Churn Analysis interfaces
export interface FileChurnStats {
  path: string;
  changeCount: number;
  totalAdditions: number;
  totalDeletions: number;
  authors: string[];
  lastModified: string;
  churnScore: number;
}

// Bus Factor interfaces
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

// Commit Patterns interfaces
export interface CommitPatternCell {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface CommitPatterns {
  hourlyDistribution: CommitPatternCell[];
  peakHour: number;
  peakDay: number;
  totalCommits: number;
}

// Branch Lifespan interfaces
export interface BranchLifespan {
  branchName: string;
  createdAt: string;
  mergedAt: string | null;
  lifespanDays: number | null;
  status: "active" | "merged" | "stale";
  commitCount: number;
}

function parseRefs(refsString: string): RefInfo[] {
  if (!refsString || refsString.trim() === "") return [];

  const refs: RefInfo[] = [];
  const parts = refsString.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.startsWith("HEAD -> ")) {
      refs.push({
        name: part.replace("HEAD -> ", ""),
        type: "branch",
        isHead: true,
      });
    } else if (part === "HEAD") {
      continue;
    } else if (part.startsWith("tag: ")) {
      refs.push({
        name: part.replace("tag: ", ""),
        type: "tag",
        isHead: false,
      });
    } else if (part.startsWith("origin/")) {
      refs.push({
        name: part,
        type: "remote",
        isHead: false,
      });
    } else if (part) {
      refs.push({
        name: part,
        type: "branch",
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
    return match ? match[1].replace(".git", "") : "repository";
  }

  /**
   * Injects a token into a git URL for authenticated cloning.
   * Supports GitHub, GitLab, and Bitbucket URL formats.
   */
  private injectTokenIntoUrl(url: string, token: string): string {
    try {
      const urlObj = new URL(url);

      // Determine the auth format based on the host
      if (urlObj.host.includes("gitlab")) {
        // GitLab uses oauth2:TOKEN format
        urlObj.username = "oauth2";
        urlObj.password = token;
      } else {
        // GitHub and others use TOKEN as username
        urlObj.username = token;
        urlObj.password = "";
      }

      return urlObj.toString();
    } catch {
      // If URL parsing fails, return original
      return url;
    }
  }

  async cloneRepository(
    url: string,
    options: { shallow?: boolean; depth?: number; token?: string } = {},
  ): Promise<string> {
    if (!this.validateGitUrl(url)) {
      throw new Error("Invalid git repository URL");
    }

    const { shallow = true, depth = 500, token } = options;

    const repoName = this.extractRepoName(url);
    const tempDir = path.join(os.tmpdir(), `gitvis-${repoName}-${Date.now()}`);

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    const git = simpleGit();

    try {
      const cloneArgs: string[] = ["--no-single-branch"]; // Fetch all branches, not just default

      if (shallow) {
        cloneArgs.push("--depth", depth.toString());
      }

      // Use authenticated URL if token provided
      const cloneUrl = token ? this.injectTokenIntoUrl(url, token) : url;

      await git.clone(cloneUrl, tempDir, cloneArgs);

      return tempDir;
    } catch (error) {
      // Clean up on failure
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

      const errorMessage = (error as Error).message;

      // Detect authentication errors and provide helpful message
      if (
        errorMessage.includes("Authentication failed") ||
        errorMessage.includes("could not read Username") ||
        errorMessage.includes("terminal prompts disabled") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403")
      ) {
        throw new Error(
          "AUTH_REQUIRED: This repository requires authentication. Please provide a personal access token.",
        );
      }

      throw new Error(`Failed to clone repository: ${errorMessage}`);
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

    const name = repoPath.split("/").filter(Boolean).pop() || "repository";

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

    let recommendedMode: "full" | "paginated" | "simplified" = "full";
    if (totalCommits > HUGE_REPO_THRESHOLD) {
      recommendedMode = "simplified";
    } else if (totalCommits > LARGE_REPO_THRESHOLD) {
      recommendedMode = "paginated";
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

    const name = repoPath.split("/").filter(Boolean).pop() || "repository";

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
      "--all": null,
      "--date-order": null,
      format: {
        hash: "%H",
        shortHash: "%h",
        message: "%s",
        body: "%b",
        authorName: "%an",
        authorEmail: "%ae",
        date: "%aI",
        parents: "%P",
        refs: "%D",
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
      parents: entry.parents ? entry.parents.split(" ").filter(Boolean) : [],
      refs: parseRefs(entry.refs),
    }));
  }

  private async getBranches(git: SimpleGit): Promise<Branch[]> {
    const result = await git.branch(["-a", "-v"]);
    const branches: Branch[] = [];

    for (const [name, data] of Object.entries(result.branches)) {
      branches.push({
        name: data.name,
        commit: data.commit,
        isRemote: name.startsWith("remotes/"),
        isHead: data.current,
      });
    }

    return branches;
  }

  private async getTags(git: SimpleGit): Promise<Tag[]> {
    try {
      // Use show-ref --tags for O(1) instead of O(N) revparse calls
      const result = await git.raw(["show-ref", "--tags"]);
      return result
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [commit, ref] = line.split(" ");
          return {
            name: ref.replace("refs/tags/", ""),
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
      const result = await git.revparse(["--abbrev-ref", "HEAD"]);
      return result.trim();
    } catch {
      return "HEAD";
    }
  }

  private async getTotalCommitCount(git: SimpleGit): Promise<number> {
    try {
      const result = await git.raw(["rev-list", "--all", "--count"]);
      return parseInt(result.trim(), 10);
    } catch {
      return 0;
    }
  }

  async getCommitsPaginated(
    repoPath: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedCommits> {
    const git = this.getGit(repoPath);
    const {
      maxCount = 500,
      skip = 0,
      firstParent = false,
      since,
      until,
      branch,
      authors,
    } = options;

    const format = {
      hash: "%H",
      shortHash: "%h",
      message: "%s",
      body: "%b",
      authorName: "%an",
      authorEmail: "%ae",
      date: "%aI",
      parents: "%P",
      refs: "%D",
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

    // Build log options with optional date and branch filters
    const logOptions: Record<string, any> = {
      "--date-order": null,
      maxCount: maxCount + 1,
      "--skip": skip,
      format,
    };

    // Use specific branch or all branches
    if (branch) {
      logOptions[branch] = null;
    } else {
      logOptions["--all"] = null;
    }

    if (firstParent) {
      logOptions["--first-parent"] = null;
    }

    if (since) {
      logOptions["--since"] = since;
    }

    if (until) {
      logOptions["--until"] = until;
    }

    // Add author filters (multiple --author flags are OR'd together)
    if (authors && authors.length > 0) {
      for (const author of authors) {
        logOptions[`--author=${author}`] = null;
      }
    }

    // Get total count with filters
    const getTotalWithFilters = async (): Promise<number> => {
      const args = ["rev-list", "--count"];
      if (branch) {
        args.push(branch);
      } else {
        args.push("--all");
      }
      if (since) args.push(`--since=${since}`);
      if (until) args.push(`--until=${until}`);
      if (authors && authors.length > 0) {
        for (const author of authors) {
          args.push(`--author=${author}`);
        }
      }
      try {
        const result = await git.raw(args);
        return parseInt(result.trim(), 10);
      } catch {
        return 0;
      }
    };

    const [log, total] = await Promise.all([
      git.log(logOptions),
      getTotalWithFilters(),
    ]);

    const hasMore = log.all.length > maxCount;
    const commits = (log.all as unknown as LogEntry[])
      .slice(0, maxCount)
      .map((entry) => ({
        hash: entry.hash,
        shortHash: entry.shortHash,
        message: entry.message,
        body: entry.body,
        author: {
          name: entry.authorName,
          email: entry.authorEmail,
        },
        date: entry.date,
        parents: entry.parents ? entry.parents.split(" ").filter(Boolean) : [],
        refs: parseRefs(entry.refs),
      }));

    return { commits, total, hasMore };
  }

  // Generator for streaming commits in chunks
  async *streamCommits(
    repoPath: string,
    options: { chunkSize?: number; firstParent?: boolean } = {},
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
        progress: Math.min(
          100,
          Math.round(((skip + result.commits.length) / total) * 100),
        ),
        total,
      };

      if (!result.hasMore || result.commits.length === 0) {
        break;
      }
      skip += chunkSize;
    }
  }

  async getCommitDetails(
    repoPath: string,
    hash: string,
  ): Promise<Commit | null> {
    const git = this.getGit(repoPath);

    try {
      // Use a unique delimiter to separate fields reliably
      const DELIM = "<<<GITVIS_DELIM>>>";
      const result = await git.raw([
        "show",
        "--no-patch",
        `--format=%H${DELIM}%h${DELIM}%s${DELIM}%b${DELIM}%an${DELIM}%ae${DELIM}%aI${DELIM}%P${DELIM}%D`,
        hash,
      ]);

      const parts = result.trim().split(DELIM);
      if (parts.length < 8) return null;

      const [
        fullHash,
        shortHash,
        message,
        body,
        authorName,
        authorEmail,
        date,
        parents,
        refs = "",
      ] = parts;

      return {
        hash: fullHash,
        shortHash: shortHash,
        message: message,
        body: body.trim(),
        author: {
          name: authorName,
          email: authorEmail,
        },
        date: date,
        parents: parents ? parents.split(" ").filter(Boolean) : [],
        refs: parseRefs(refs),
      };
    } catch (error) {
      console.error("getCommitDetails error:", error);
      return null;
    }
  }

  // Empty tree hash used for root commits (first commit has no parent)
  private readonly EMPTY_TREE_HASH = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

  async getCommitDiffStats(
    repoPath: string,
    commitHash: string,
  ): Promise<DiffStats> {
    const git = this.getGit(repoPath);

    // Get parent commit hash (empty tree for root commit)
    let parentHash = this.EMPTY_TREE_HASH;
    try {
      const parent = await git.raw(["rev-parse", `${commitHash}^`]);
      parentHash = parent.trim();
    } catch {
      // Root commit - use empty tree
    }

    // Get numstat for additions/deletions count
    const numstat = await git.raw([
      "diff",
      "--numstat",
      "--find-renames",
      "--find-copies",
      parentHash,
      commitHash,
    ]);

    // Get name-status for file status (A/D/M/R/C)
    const nameStatus = await git.raw([
      "diff",
      "--name-status",
      "--find-renames",
      "--find-copies",
      parentHash,
      commitHash,
    ]);

    // Parse name-status to get file statuses
    const statusMap = new Map<string, { status: string; oldPath?: string }>();
    for (const line of nameStatus.trim().split("\n").filter(Boolean)) {
      const parts = line.split("\t");
      const status = parts[0];
      if (status.startsWith("R") || status.startsWith("C")) {
        // Rename or copy: R100\toldPath\tnewPath
        statusMap.set(parts[2], { status: status[0], oldPath: parts[1] });
      } else {
        statusMap.set(parts[1], { status: status[0] });
      }
    }

    // Parse numstat and combine with status
    const files: FileDiff[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const line of numstat.trim().split("\n").filter(Boolean)) {
      const parts = line.split("\t");
      const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10);
      const deletions = parts[1] === "-" ? 0 : parseInt(parts[1], 10);
      const binary = parts[0] === "-" && parts[1] === "-";

      // Handle renamed files (path format: oldPath => newPath or just newPath)
      let filePath = parts[2];
      if (filePath.includes(" => ")) {
        // Format: path/to/{old => new}/file.txt or old.txt => new.txt
        const match =
          filePath.match(/^(.*)?\{(.+) => (.+)\}(.*)$/) ||
          filePath.match(/^(.+) => (.+)$/);
        if (match) {
          if (match.length === 5) {
            // {old => new} format
            filePath = match[1] + match[3] + match[4];
          } else {
            // simple old => new format
            filePath = match[2];
          }
        }
      }

      const statusInfo = statusMap.get(filePath) || { status: "M" };
      const statusChar = statusInfo.status;

      let status: FileDiff["status"] = "modified";
      if (statusChar === "A") status = "added";
      else if (statusChar === "D") status = "deleted";
      else if (statusChar === "R") status = "renamed";
      else if (statusChar === "C") status = "copied";

      files.push({
        path: filePath,
        oldPath: statusInfo.oldPath,
        status,
        additions,
        deletions,
        binary,
      });

      totalAdditions += additions;
      totalDeletions += deletions;
    }

    return { files, totalAdditions, totalDeletions };
  }

  async getFileDiff(
    repoPath: string,
    commitHash: string,
    filePath: string,
  ): Promise<FileDiffDetail> {
    const git = this.getGit(repoPath);

    // Get parent hash
    let parentHash = this.EMPTY_TREE_HASH;
    try {
      const parent = await git.raw(["rev-parse", `${commitHash}^`]);
      parentHash = parent.trim();
    } catch {
      // Root commit
    }

    // Get file status and stats
    const stats = await this.getCommitDiffStats(repoPath, commitHash);
    const fileStats = stats.files.find((f) => f.path === filePath);

    if (!fileStats) {
      throw new Error(`File ${filePath} not found in commit ${commitHash}`);
    }

    // Get unified diff for the file
    const diffPath = fileStats.oldPath ? `${fileStats.oldPath}` : filePath;

    const diffOutput = await git.raw([
      "diff",
      "--unified=3",
      parentHash,
      commitHash,
      "--",
      diffPath,
      ...(fileStats.oldPath ? [filePath] : []),
    ]);

    // Parse hunks from unified diff
    const hunks: DiffHunk[] = [];
    const hunkRegex = /@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/g;
    const lines = diffOutput.split("\n");

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const hunkMatches: { index: number; match: RegExpExecArray }[] = [];

    while ((match = hunkRegex.exec(diffOutput)) !== null) {
      hunkMatches.push({
        index: match.index,
        match: { ...match } as RegExpExecArray,
      });
    }

    for (let i = 0; i < hunkMatches.length; i++) {
      const { match } = hunkMatches[i];
      const oldStart = parseInt(match[1], 10);
      const oldLines = match[2] ? parseInt(match[2], 10) : 1;
      const newStart = parseInt(match[3], 10);
      const newLines = match[4] ? parseInt(match[4], 10) : 1;

      // Find content between this hunk header and the next (or end)
      const startIdx = diffOutput.indexOf("\n", hunkMatches[i].index) + 1;
      const endIdx =
        i + 1 < hunkMatches.length
          ? hunkMatches[i + 1].index
          : diffOutput.length;

      const content = diffOutput.slice(startIdx, endIdx).trimEnd();

      hunks.push({
        oldStart,
        oldLines,
        newStart,
        newLines,
        content,
      });
    }

    return {
      ...fileStats,
      hunks,
    };
  }

  async getFileTree(
    repoPath: string,
    commitHash: string,
    treePath: string = "",
  ): Promise<TreeEntry[]> {
    const git = this.getGit(repoPath);

    // Use ls-tree to list directory contents
    // -l flag includes file size
    const args = ["ls-tree", "-l", commitHash];
    if (treePath) {
      args.push(treePath + "/");
    }

    const result = await git.raw(args);
    const entries: TreeEntry[] = [];

    for (const line of result.trim().split("\n").filter(Boolean)) {
      // Format: mode type hash size\tpath
      // Example: 100644 blob abc123 1234\tsrc/file.ts
      // For trees (dirs): 040000 tree abc123 -\tsrc/components
      const match = line.match(/^(\d+)\s+(\w+)\s+([a-f0-9]+)\s+(-|\d+)\t(.+)$/);
      if (!match) continue;

      const [, mode, type, hash, size, fullPath] = match;
      const name = fullPath.split("/").pop() || fullPath;

      entries.push({
        name,
        path: fullPath,
        type: type === "tree" ? "directory" : "file",
        size: size === "-" ? undefined : parseInt(size, 10),
      });
    }

    // Sort: directories first, then alphabetically
    entries.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return entries;
  }

  async getFileContent(
    repoPath: string,
    commitHash: string,
    filePath: string,
  ): Promise<FileContent> {
    const git = this.getGit(repoPath);

    // Check if file is binary
    const isBinary = await this.isFileBinary(git, commitHash, filePath);

    if (isBinary) {
      // For binary files, just return metadata
      const size = await this.getFileSize(git, commitHash, filePath);
      return {
        path: filePath,
        content: "",
        size,
        binary: true,
      };
    }

    // Get file content using git show
    const content = await git.raw(["show", `${commitHash}:${filePath}`]);

    return {
      path: filePath,
      content,
      size: Buffer.byteLength(content, "utf-8"),
      binary: false,
    };
  }

  private async isFileBinary(
    git: SimpleGit,
    commitHash: string,
    filePath: string,
  ): Promise<boolean> {
    try {
      // Use git diff to check if file is binary
      const result = await git.raw([
        "diff",
        "--numstat",
        this.EMPTY_TREE_HASH,
        commitHash,
        "--",
        filePath,
      ]);
      // Binary files show "-\t-\tfilepath"
      return result.startsWith("-\t-");
    } catch {
      return false;
    }
  }

  private async getFileSize(
    git: SimpleGit,
    commitHash: string,
    filePath: string,
  ): Promise<number> {
    try {
      const result = await git.raw([
        "cat-file",
        "-s",
        `${commitHash}:${filePath}`,
      ]);
      return parseInt(result.trim(), 10);
    } catch {
      return 0;
    }
  }

  // ===== CONTRIBUTOR STATS METHODS =====

  async getContributorStats(repoPath: string): Promise<ContributorStats[]> {
    const git = this.getGit(repoPath);

    // Get commit counts per author using shortlog
    const shortlog = await git.raw(["shortlog", "-sne", "--all"]);

    // Parse shortlog output: "  123\tAuthor Name <email@example.com>"
    const contributors = new Map<string, ContributorStats>();

    for (const line of shortlog.trim().split("\n").filter(Boolean)) {
      const match = line.match(/^\s*(\d+)\t(.+)\s<(.+)>$/);
      if (match) {
        const [, count, name, email] = match;
        contributors.set(email, {
          name,
          email,
          commitCount: parseInt(count, 10),
          additions: 0,
          deletions: 0,
          firstCommit: "",
          lastCommit: "",
        });
      }
    }

    // Get first and last commit dates per author
    const dateLog = await git.raw(["log", "--all", "--format=%ae|%aI"]);

    const authorDates = new Map<string, string[]>();
    for (const line of dateLog.trim().split("\n").filter(Boolean)) {
      const [email, date] = line.split("|");
      if (!authorDates.has(email)) {
        authorDates.set(email, []);
      }
      authorDates.get(email)!.push(date);
    }

    // Set first and last commit dates
    for (const [email, dates] of authorDates) {
      if (contributors.has(email) && dates.length > 0) {
        const contributor = contributors.get(email)!;
        // Dates come in reverse chronological order from git log
        contributor.lastCommit = dates[0];
        contributor.firstCommit = dates[dates.length - 1];
      }
    }

    // Get line stats per author (can be slow for large repos, so we sample)
    try {
      const statLog = await git.raw([
        "log",
        "--all",
        "--shortstat",
        "--format=%ae",
        "-n",
        "1000", // Limit to recent 1000 commits for performance
      ]);

      let currentEmail = "";
      for (const line of statLog.split("\n")) {
        if (line.includes("@")) {
          currentEmail = line.trim();
        } else if (line.includes("insertion") || line.includes("deletion")) {
          const insertMatch = line.match(/(\d+) insertion/);
          const deleteMatch = line.match(/(\d+) deletion/);

          if (contributors.has(currentEmail)) {
            const contributor = contributors.get(currentEmail)!;
            if (insertMatch) {
              contributor.additions += parseInt(insertMatch[1], 10);
            }
            if (deleteMatch) {
              contributor.deletions += parseInt(deleteMatch[1], 10);
            }
          }
        }
      }
    } catch {
      // Line stats failed, continue without them
    }

    // Sort by commit count descending
    return Array.from(contributors.values()).sort(
      (a, b) => b.commitCount - a.commitCount,
    );
  }

  async getActivityHeatmap(
    repoPath: string,
    days: number = 365,
  ): Promise<ActivityDay[]> {
    const git = this.getGit(repoPath);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all commit dates
    const log = await git.raw([
      "log",
      "--all",
      "--format=%aI",
      `--since=${startDate.toISOString()}`,
    ]);

    // Count commits per day
    const dayCounts = new Map<string, number>();

    for (const line of log.trim().split("\n").filter(Boolean)) {
      const date = line.split("T")[0]; // Extract YYYY-MM-DD
      dayCounts.set(date, (dayCounts.get(date) || 0) + 1);
    }

    // Generate array for all days in range
    const result: ActivityDay[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        count: dayCounts.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  // ===== REMOTE METHODS =====

  async getRemoteUrls(
    repoPath: string,
  ): Promise<{ name: string; url: string }[]> {
    const git = this.getGit(repoPath);
    try {
      const remotes = await git.getRemotes(true);
      return remotes.map((r) => ({
        name: r.name,
        url: r.refs.fetch || r.refs.push || "",
      }));
    } catch {
      return [];
    }
  }

  // ===== SUBMODULE METHODS =====

  async hasSubmodules(repoPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(repoPath, ".gitmodules"));
      return true;
    } catch {
      return false;
    }
  }

  async getSubmodules(repoPath: string): Promise<Submodule[]> {
    const git = this.getGit(repoPath);

    // Check if .gitmodules exists
    const hasModules = await this.hasSubmodules(repoPath);
    if (!hasModules) {
      return [];
    }

    // Get submodule config
    let configOutput: string;
    try {
      configOutput = await git.raw([
        "config",
        "--file",
        ".gitmodules",
        "--list",
      ]);
    } catch {
      return [];
    }

    // Parse config output
    // Format: submodule.<name>.path=<path>
    //         submodule.<name>.url=<url>
    const submoduleMap = new Map<
      string,
      { path?: string; url?: string; branch?: string }
    >();

    for (const line of configOutput.trim().split("\n").filter(Boolean)) {
      const match = line.match(/^submodule\.([^.]+)\.(\w+)=(.+)$/);
      if (match) {
        const [, name, key, value] = match;
        if (!submoduleMap.has(name)) {
          submoduleMap.set(name, {});
        }
        const sub = submoduleMap.get(name)!;
        if (key === "path") sub.path = value;
        else if (key === "url") sub.url = value;
        else if (key === "branch") sub.branch = value;
      }
    }

    // Get submodule status for current commits
    let statusOutput = "";
    try {
      statusOutput = await git.raw(["submodule", "status"]);
    } catch {
      // Submodule status failed
    }

    // Parse status: " <commit> <path> (<desc>)" or "-<commit> <path>" (not initialized)
    const statusMap = new Map<
      string,
      { commit: string; initialized: boolean }
    >();
    for (const line of statusOutput.trim().split("\n").filter(Boolean)) {
      const initialized = !line.startsWith("-");
      const match = line.match(/^[-+ ]?([a-f0-9]+)\s+(\S+)/);
      if (match) {
        statusMap.set(match[2], {
          commit: match[1],
          initialized,
        });
      }
    }

    // Build submodule list
    const submodules: Submodule[] = [];
    for (const [name, config] of submoduleMap) {
      if (config.path && config.url) {
        const status = statusMap.get(config.path);
        submodules.push({
          name,
          path: config.path,
          url: config.url,
          currentCommit: status?.commit || "",
          initialized: status?.initialized ?? false,
        });
      }
    }

    return submodules.sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Load a submodule as a separate repository
   * Returns the full path to the submodule if valid
   */
  async loadSubmoduleRepository(
    repoPath: string,
    submodulePath: string,
  ): Promise<string> {
    // Get submodule info
    const submodules = await this.getSubmodules(repoPath);
    const submodule = submodules.find((s) => s.path === submodulePath);

    if (!submodule) {
      throw new Error(`Submodule not found: ${submodulePath}`);
    }

    if (!submodule.initialized) {
      throw new Error(
        `Submodule "${submodulePath}" is not initialized. ` +
          `Run "git submodule update --init ${submodulePath}" to initialize it.`,
      );
    }

    const fullPath = path.join(repoPath, submodulePath);
    const isValid = await this.validateRepository(fullPath);

    if (!isValid) {
      throw new Error(
        `Submodule at "${submodulePath}" is not a valid git repository.`,
      );
    }

    return fullPath;
  }

  // ===== BRANCH COMPARISON METHODS =====

  async compareBranches(
    repoPath: string,
    baseBranch: string,
    compareBranch: string,
  ): Promise<BranchComparison> {
    const git = this.getGit(repoPath);

    // Get commits ahead (in compare but not in base)
    const aheadResult = await git.raw([
      "log",
      "--oneline",
      `${baseBranch}..${compareBranch}`,
      "--format=%H|%h|%s|%an|%ae|%aI|%P|%D",
    ]);

    // Get commits behind (in base but not in compare)
    const behindResult = await git.raw([
      "log",
      "--oneline",
      `${compareBranch}..${baseBranch}`,
      "--format=%H|%h|%s|%an|%ae|%aI|%P|%D",
    ]);

    const parseCommitLine = (line: string): Commit | null => {
      const parts = line.split("|");
      if (parts.length < 7) return null;
      const [
        hash,
        shortHash,
        message,
        authorName,
        authorEmail,
        date,
        parents,
        refs = "",
      ] = parts;
      return {
        hash,
        shortHash,
        message,
        body: "",
        author: { name: authorName, email: authorEmail },
        date,
        parents: parents ? parents.split(" ").filter(Boolean) : [],
        refs: parseRefs(refs),
      };
    };

    const aheadCommits = aheadResult
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(parseCommitLine)
      .filter((c): c is Commit => c !== null);

    const behindCommits = behindResult
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(parseCommitLine)
      .filter((c): c is Commit => c !== null);

    // Get diff stats between branches
    const numstat = await git.raw([
      "diff",
      "--numstat",
      "--find-renames",
      "--find-copies",
      baseBranch,
      compareBranch,
    ]);

    const nameStatus = await git.raw([
      "diff",
      "--name-status",
      "--find-renames",
      "--find-copies",
      baseBranch,
      compareBranch,
    ]);

    // Parse name-status
    const statusMap = new Map<string, { status: string; oldPath?: string }>();
    for (const line of nameStatus.trim().split("\n").filter(Boolean)) {
      const parts = line.split("\t");
      const status = parts[0];
      if (status.startsWith("R") || status.startsWith("C")) {
        statusMap.set(parts[2], { status: status[0], oldPath: parts[1] });
      } else {
        statusMap.set(parts[1], { status: status[0] });
      }
    }

    // Parse numstat
    const files: FileDiff[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const line of numstat.trim().split("\n").filter(Boolean)) {
      const parts = line.split("\t");
      const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10);
      const deletions = parts[1] === "-" ? 0 : parseInt(parts[1], 10);
      const binary = parts[0] === "-" && parts[1] === "-";

      let filePath = parts[2];
      if (filePath.includes(" => ")) {
        const match =
          filePath.match(/^(.*)?\{(.+) => (.+)\}(.*)$/) ||
          filePath.match(/^(.+) => (.+)$/);
        if (match) {
          if (match.length === 5) {
            filePath = match[1] + match[3] + match[4];
          } else {
            filePath = match[2];
          }
        }
      }

      const statusInfo = statusMap.get(filePath) || { status: "M" };
      const statusChar = statusInfo.status;

      let status: FileDiff["status"] = "modified";
      if (statusChar === "A") status = "added";
      else if (statusChar === "D") status = "deleted";
      else if (statusChar === "R") status = "renamed";
      else if (statusChar === "C") status = "copied";

      files.push({
        path: filePath,
        oldPath: statusInfo.oldPath,
        status,
        additions,
        deletions,
        binary,
      });

      totalAdditions += additions;
      totalDeletions += deletions;
    }

    return {
      baseBranch,
      compareBranch,
      aheadCount: aheadCommits.length,
      behindCount: behindCommits.length,
      aheadCommits,
      behindCommits,
      files,
      totalAdditions,
      totalDeletions,
    };
  }

  // ===== CODE CHURN ANALYSIS =====

  async getCodeChurn(
    repoPath: string,
    limit: number = 50,
  ): Promise<FileChurnStats[]> {
    const git = this.getGit(repoPath);

    // Get file changes with stats
    const log = await git.raw([
      "log",
      "--all",
      "--format=%H|%ae|%aI",
      "--numstat",
      "-n",
      "5000", // Limit for performance
    ]);

    // Parse and aggregate file stats
    const fileStats = new Map<
      string,
      {
        changeCount: number;
        additions: number;
        deletions: number;
        authors: Set<string>;
        lastModified: string;
      }
    >();

    let currentAuthor = "";
    let currentDate = "";

    for (const line of log.split("\n")) {
      if (line.includes("|")) {
        // Commit line: hash|author|date
        const parts = line.split("|");
        if (parts.length >= 3) {
          currentAuthor = parts[1];
          currentDate = parts[2];
        }
      } else if (line.match(/^\d+\t\d+\t/)) {
        // Numstat line: additions\tdeletions\tfilepath
        const parts = line.split("\t");
        const additions = parseInt(parts[0], 10) || 0;
        const deletions = parseInt(parts[1], 10) || 0;
        const filePath = parts[2];

        if (filePath && !filePath.includes(" => ")) {
          if (!fileStats.has(filePath)) {
            fileStats.set(filePath, {
              changeCount: 0,
              additions: 0,
              deletions: 0,
              authors: new Set(),
              lastModified: currentDate,
            });
          }

          const stats = fileStats.get(filePath)!;
          stats.changeCount++;
          stats.additions += additions;
          stats.deletions += deletions;
          stats.authors.add(currentAuthor);
          if (currentDate > stats.lastModified) {
            stats.lastModified = currentDate;
          }
        }
      }
    }

    // Calculate churn score and convert to array
    const result: FileChurnStats[] = [];
    const now = new Date();

    for (const [path, stats] of fileStats) {
      // Churn score: weighted combination of change frequency, author count, and recency
      const daysSinceModified = Math.max(
        1,
        (now.getTime() - new Date(stats.lastModified).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const recencyScore = Math.min(1, 30 / daysSinceModified); // Higher if modified recently
      const churnScore =
        stats.changeCount * 0.6 +
        stats.authors.size * 0.2 * 10 +
        recencyScore * 0.2 * 100;

      result.push({
        path,
        changeCount: stats.changeCount,
        totalAdditions: stats.additions,
        totalDeletions: stats.deletions,
        authors: Array.from(stats.authors),
        lastModified: stats.lastModified,
        churnScore: Math.round(churnScore * 100) / 100,
      });
    }

    // Sort by churn score and limit
    return result.sort((a, b) => b.churnScore - a.churnScore).slice(0, limit);
  }

  // ===== BUS FACTOR ANALYSIS =====

  async getBusFactor(
    repoPath: string,
    minCommits: number = 5,
  ): Promise<FileBusFactor[]> {
    const git = this.getGit(repoPath);

    // Get file authorship data
    const log = await git.raw([
      "log",
      "--all",
      "--format=%an|%ae",
      "--name-only",
      "-n",
      "5000", // Limit for performance
    ]);

    // Aggregate commits per file per author
    const fileAuthors = new Map<
      string,
      Map<string, { name: string; email: string; commits: number }>
    >();

    let currentAuthor = { name: "", email: "" };

    for (const line of log.split("\n")) {
      if (line.includes("|")) {
        const [name, email] = line.split("|");
        currentAuthor = { name, email };
      } else if (line.trim() && !line.startsWith(" ")) {
        const filePath = line.trim();
        if (filePath) {
          if (!fileAuthors.has(filePath)) {
            fileAuthors.set(filePath, new Map());
          }

          const authors = fileAuthors.get(filePath)!;
          const key = currentAuthor.email;
          if (!authors.has(key)) {
            authors.set(key, { ...currentAuthor, commits: 0 });
          }
          authors.get(key)!.commits++;
        }
      }
    }

    // Calculate bus factor for each file
    const result: FileBusFactor[] = [];

    for (const [path, authors] of fileAuthors) {
      const contributorArray = Array.from(authors.values());
      const totalCommits = contributorArray.reduce(
        (sum, a) => sum + a.commits,
        0,
      );

      // Skip files with few commits
      if (totalCommits < minCommits) continue;

      // Sort by commits descending
      contributorArray.sort((a, b) => b.commits - a.commits);

      const primary = contributorArray[0];
      const primaryPercentage = (primary.commits / totalCommits) * 100;

      // Calculate bus factor: count of contributors with >10% of commits
      const significantContributors = contributorArray.filter(
        (a) => a.commits / totalCommits >= 0.1,
      ).length;

      result.push({
        path,
        primaryAuthor: {
          name: primary.name,
          email: primary.email,
          percentage: Math.round(primaryPercentage * 10) / 10,
        },
        totalCommits,
        uniqueContributors: contributorArray.length,
        busFactor: significantContributors,
        contributors: contributorArray.slice(0, 5).map((c) => ({
          name: c.name,
          email: c.email,
          commits: c.commits,
          percentage: Math.round((c.commits / totalCommits) * 1000) / 10,
        })),
      });
    }

    // Sort by bus factor ascending (lower = higher risk)
    return result.sort((a, b) => a.busFactor - b.busFactor);
  }

  // ===== COMMIT PATTERNS =====

  async getCommitPatterns(repoPath: string): Promise<CommitPatterns> {
    const git = this.getGit(repoPath);

    // Get all commit timestamps
    const log = await git.raw(["log", "--all", "--format=%aI"]);

    // Build 7x24 matrix (dayOfWeek x hour)
    const matrix = new Map<string, number>();
    const hourTotals = new Map<number, number>();
    const dayTotals = new Map<number, number>();
    let totalCommits = 0;

    for (const line of log.trim().split("\n").filter(Boolean)) {
      const date = new Date(line);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;

      matrix.set(key, (matrix.get(key) || 0) + 1);
      hourTotals.set(hour, (hourTotals.get(hour) || 0) + 1);
      dayTotals.set(dayOfWeek, (dayTotals.get(dayOfWeek) || 0) + 1);
      totalCommits++;
    }

    // Find peak hour and day
    let peakHour = 0;
    let peakHourCount = 0;
    for (const [hour, count] of hourTotals) {
      if (count > peakHourCount) {
        peakHour = hour;
        peakHourCount = count;
      }
    }

    let peakDay = 0;
    let peakDayCount = 0;
    for (const [day, count] of dayTotals) {
      if (count > peakDayCount) {
        peakDay = day;
        peakDayCount = count;
      }
    }

    // Convert matrix to array
    const hourlyDistribution: CommitPatternCell[] = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${dayOfWeek}-${hour}`;
        hourlyDistribution.push({
          dayOfWeek,
          hour,
          count: matrix.get(key) || 0,
        });
      }
    }

    return {
      hourlyDistribution,
      peakHour,
      peakDay,
      totalCommits,
    };
  }

  // ===== BRANCH LIFESPAN =====

  async getBranchLifespans(repoPath: string): Promise<BranchLifespan[]> {
    const git = this.getGit(repoPath);

    // Get all branches
    const branches = await this.getBranches(git);
    const localBranches = branches.filter((b) => !b.isRemote);

    // Find default branch (main or master)
    const defaultBranch =
      localBranches.find((b) => b.name === "main" || b.name === "master")
        ?.name || "main";

    // Get merged branches
    let mergedBranchesRaw = "";
    try {
      mergedBranchesRaw = await git.raw(["branch", "--merged", defaultBranch]);
    } catch {
      // Default branch might not exist
    }
    const mergedBranches = new Set(
      mergedBranchesRaw
        .split("\n")
        .map((b) => b.replace("*", "").trim())
        .filter(Boolean),
    );

    const result: BranchLifespan[] = [];
    const now = new Date();
    const STALE_DAYS = 90;

    for (const branch of localBranches) {
      try {
        // Get first commit on this branch (when it diverged)
        const firstCommit = await git.raw([
          "log",
          branch.name,
          "--reverse",
          "--format=%aI",
          "-1",
        ]);

        // Get last commit on this branch
        const lastCommit = await git.raw([
          "log",
          branch.name,
          "--format=%aI",
          "-1",
        ]);

        // Get commit count
        const commitCountRaw = await git.raw([
          "rev-list",
          "--count",
          branch.name,
        ]);

        const createdAt = firstCommit.trim();
        const lastActivity = lastCommit.trim();
        const commitCount = parseInt(commitCountRaw.trim(), 10);

        // Determine status
        const isMerged =
          mergedBranches.has(branch.name) && branch.name !== defaultBranch;
        const daysSinceActivity =
          (now.getTime() - new Date(lastActivity).getTime()) /
          (1000 * 60 * 60 * 24);
        const isStale = !isMerged && daysSinceActivity > STALE_DAYS;

        let status: "active" | "merged" | "stale" = "active";
        if (isMerged) status = "merged";
        else if (isStale) status = "stale";

        // Calculate lifespan
        let lifespanDays: number | null = null;
        let mergedAt: string | null = null;

        if (isMerged) {
          // Find merge commit
          try {
            const mergeLog = await git.raw([
              "log",
              defaultBranch,
              "--merges",
              "--format=%aI",
              "--ancestry-path",
              `${branch.name}..${defaultBranch}`,
              "-1",
            ]);
            if (mergeLog.trim()) {
              mergedAt = mergeLog.trim();
              lifespanDays = Math.round(
                (new Date(mergedAt).getTime() - new Date(createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              );
            }
          } catch {
            // Merge commit not found
          }
        } else {
          // Active/stale branch - lifespan is from creation to now
          lifespanDays = Math.round(daysSinceActivity);
        }

        result.push({
          branchName: branch.name,
          createdAt,
          mergedAt,
          lifespanDays,
          status,
          commitCount,
        });
      } catch {
        // Skip branches that can't be analyzed
      }
    }

    // Sort by status (active first, then stale, then merged), then by lifespan
    return result.sort((a, b) => {
      const statusOrder = { active: 0, stale: 1, merged: 2 };
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return (b.lifespanDays || 0) - (a.lifespanDays || 0);
    });
  }
}

export const gitService = new GitService();
