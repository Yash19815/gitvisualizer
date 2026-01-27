import type {
  GitHubRepoInfo,
  CommitGitHubInfo,
  GitHubInfoResponse,
  GitHubRepoInfoResponse,
  GitHubRateLimitResponse,
} from "../types";

const API_BASE = "http://localhost:3001/api";

// Progress event types for streaming
export interface GitHubProgressEvent {
  step: string;
  status: "start" | "success" | "error" | "info";
  message: string;
  data?: Record<string, unknown>;
}

export interface GitHubStreamCallbacks {
  onProgress: (event: GitHubProgressEvent) => void;
  onComplete: (data: CommitGitHubInfo) => void;
  onError: (error: string) => void;
}

/**
 * Set GitHub token for authenticated requests (higher rate limits)
 */
export async function setGitHubToken(token: string | null): Promise<boolean> {
  const response = await fetch(`${API_BASE}/github/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error("Failed to set GitHub token");
  }

  const data = await response.json();
  return data.hasToken;
}

/**
 * Get GitHub rate limit status
 */
export async function getGitHubRateLimit(): Promise<{
  remaining: number;
  limit: number;
  resetAt: string;
} | null> {
  const response = await fetch(`${API_BASE}/github/rate-limit`);

  if (!response.ok) {
    throw new Error("Failed to get rate limit");
  }

  const data: GitHubRateLimitResponse = await response.json();
  return data.data || null;
}

/**
 * Get GitHub repo info (owner/repo) from repository
 */
export async function getGitHubRepoInfo(
  repoPath: string,
): Promise<GitHubRepoInfo | null> {
  const response = await fetch(`${API_BASE}/github/repo-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: repoPath }),
  });

  if (!response.ok) {
    throw new Error("Failed to get GitHub repo info");
  }

  const data: GitHubRepoInfoResponse = await response.json();

  if (!data.success || !data.data?.isGitHub) {
    return null;
  }

  return data.data;
}

/**
 * Get GitHub info (PRs and linked issues) for a commit
 */
export async function getCommitGitHubInfo(
  repoPath: string,
  commitHash: string,
): Promise<CommitGitHubInfo> {
  const response = await fetch(`${API_BASE}/github/commit/${commitHash}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: repoPath }),
  });

  if (!response.ok) {
    throw new Error("Failed to get GitHub info for commit");
  }

  const data: GitHubInfoResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Unknown error");
  }

  return data.data || { pullRequests: [], linkedIssues: [] };
}

/**
 * Stream GitHub info with real-time progress updates
 */
export function streamCommitGitHubInfo(
  repoPath: string,
  commitHash: string,
  callbacks: GitHubStreamCallbacks,
): () => void {
  const controller = new AbortController();

  fetch(`${API_BASE}/github/commit/${commitHash}/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: repoPath }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to stream GitHub info");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            eventData = line.slice(6);

            if (eventType && eventData) {
              try {
                const parsed = JSON.parse(eventData);

                switch (eventType) {
                  case "progress":
                    callbacks.onProgress(parsed);
                    break;
                  case "complete":
                    callbacks.onComplete(parsed.data);
                    break;
                  case "error":
                    callbacks.onError(parsed.message);
                    break;
                }
              } catch {
                // Ignore parse errors
              }
              eventType = "";
              eventData = "";
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        callbacks.onError(error.message);
      }
    });

  // Return abort function
  return () => controller.abort();
}
