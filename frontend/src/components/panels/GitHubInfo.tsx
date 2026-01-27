import { useEffect, useState, useCallback, useRef } from "react";
import { useRepositoryStore } from "../../store/repositoryStore";
import { GitHubTokenModal } from "../settings/GitHubTokenModal";
import {
  streamCommitGitHubInfo,
  type GitHubProgressEvent,
} from "../../api/githubApi";
import type { CommitGitHubInfo } from "../../types";

// Progress step type
interface ProgressStep {
  id: string;
  message: string;
  status: "pending" | "loading" | "success" | "error" | "info";
  timestamp: number;
}

function PRStatusBadge({ state }: { state: "open" | "closed" | "merged" }) {
  const styles = {
    merged: "bg-purple-100 text-purple-700",
    open: "bg-green-100 text-green-700",
    closed: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[state]}`}>
      {state}
    </span>
  );
}

function IssueStatusBadge({ state }: { state: "open" | "closed" }) {
  const styles = {
    open: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[state]}`}>
      {state}
    </span>
  );
}

function ProgressIndicator({
  steps,
  isComplete,
}: {
  steps: ProgressStep[];
  isComplete: boolean;
}) {
  const getStatusIcon = (status: ProgressStep["status"]) => {
    switch (status) {
      case "loading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
        );
      case "success":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-200" />;
    }
  };

  const getStatusColor = (status: ProgressStep["status"]) => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  // Calculate overall progress percentage
  const completedSteps = steps.filter(
    (s) => s.status === "success" || s.status === "info",
  ).length;
  const totalSteps = Math.max(steps.length, 5); // Assume at least 5 steps
  const progressPercent = isComplete
    ? 100
    : Math.min(95, Math.round((completedSteps / totalSteps) * 100));

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Loading GitHub info...</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {steps.map((step, index) => (
          <div
            key={`${step.id}-${index}`}
            className={`flex items-start gap-2 py-1 text-xs transition-all duration-200 ${
              step.status === "loading" ? "animate-pulse" : ""
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(step.status)}
            </div>
            <span className={`flex-1 ${getStatusColor(step.status)}`}>
              {step.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GitHubInfo() {
  const {
    selectedCommit,
    githubRepoInfo,
    githubToken,
    githubError: repoError,
    fetchGitHubRepoInfo,
    repository,
  } = useRepositoryStore();

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [githubInfo, setGitHubInfo] = useState<CommitGitHubInfo | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const abortRef = useRef<(() => void) | null>(null);
  const prevCommitRef = useRef<string | null>(null);

  // Fetch GitHub repo info when component mounts
  useEffect(() => {
    if (!githubRepoInfo) {
      fetchGitHubRepoInfo();
    }
  }, [githubRepoInfo, fetchGitHubRepoInfo]);

  // Handle progress events
  const handleProgress = useCallback((event: GitHubProgressEvent) => {
    setProgressSteps((prev) => {
      // Find existing step with same id or add new one
      const existingIndex = prev.findIndex((s) => s.id === event.step);
      const newStep: ProgressStep = {
        id: event.step,
        message: event.message,
        status: event.status === "start" ? "loading" : event.status,
        timestamp: Date.now(),
      };

      if (existingIndex >= 0) {
        // Update existing step
        const updated = [...prev];
        updated[existingIndex] = newStep;
        return updated;
      } else {
        // Add new step
        return [...prev, newStep];
      }
    });
  }, []);

  // Handle completion
  const handleComplete = useCallback((data: CommitGitHubInfo) => {
    setGitHubInfo(data);
    setIsLoading(false);
    setIsComplete(true);

    // Log to console for debugging
    console.log(
      "%c[GitHub] %cLoading complete",
      "color: #6366f1; font-weight: bold",
      "color: #22c55e",
      {
        pullRequests: data.pullRequests.length,
        linkedIssues: data.linkedIssues.length,
      },
    );
  }, []);

  // Handle error
  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsLoading(false);

    // Log to console for debugging
    console.log(
      "%c[GitHub] %cError: %c" + errorMsg,
      "color: #6366f1; font-weight: bold",
      "color: #ef4444",
      "color: #ef4444",
    );
  }, []);

  // Fetch GitHub info for selected commit using streaming
  useEffect(() => {
    // Cleanup previous request
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    // Reset state when commit changes
    if (selectedCommit?.hash !== prevCommitRef.current) {
      setGitHubInfo(null);
      setProgressSteps([]);
      setError(null);
      setIsComplete(false);
      prevCommitRef.current = selectedCommit?.hash || null;
    }

    if (!selectedCommit || !githubRepoInfo?.isGitHub || !repository?.path) {
      return;
    }

    // Check if we already have the info
    if (githubInfo && isComplete) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Log to console
    console.log(
      "%c[GitHub] %cStarting fetch for commit %c" + selectedCommit.shortHash,
      "color: #6366f1; font-weight: bold",
      "color: #64748b",
      "color: #3b82f6; font-family: monospace",
    );

    // Use streaming API
    abortRef.current = streamCommitGitHubInfo(
      repository.path,
      selectedCommit.hash,
      {
        onProgress: handleProgress,
        onComplete: handleComplete,
        onError: handleError,
      },
    );

    return () => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    };
  }, [
    selectedCommit,
    githubRepoInfo,
    repository?.path,
    handleProgress,
    handleComplete,
    handleError,
    githubInfo,
    isComplete,
  ]);

  if (!selectedCommit) return null;

  // Check if repo is on GitHub
  if (githubRepoInfo === null) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm">Checking GitHub connection...</p>
        </div>
      </div>
    );
  }

  if (!githubRepoInfo.isGitHub) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium mb-1">
            {repoError ? "Failed to check GitHub" : "Not a GitHub Repository"}
          </p>
          <p className="text-xs text-gray-400">
            {repoError ||
              "GitHub integration is only available for repositories hosted on GitHub."}
          </p>
          {repoError && (
            <button
              onClick={() => fetchGitHubRepoInfo()}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* GitHub repo info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-mono">
            {githubRepoInfo.owner}/{githubRepoInfo.repo}
          </span>
        </div>
        <button
          onClick={() => setShowTokenModal(true)}
          className={`text-xs px-2 py-1 rounded ${
            githubToken
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {githubToken ? "Token Set" : "Add Token"}
        </button>
      </div>

      {/* Loading state with progress */}
      {isLoading && progressSteps.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <ProgressIndicator steps={progressSteps} isComplete={isComplete} />
        </div>
      )}

      {/* Simple loading spinner when no progress yet */}
      {isLoading && progressSteps.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">Failed to load GitHub info</p>
              <p className="text-xs mt-1">{error}</p>
              {error.includes("Commit not found") && (
                <p className="text-xs mt-2 text-red-600">
                  This may be because the repository was cloned with shallow
                  history. Try cloning with "full history" option.
                </p>
              )}
              {!githubToken && (
                <button
                  onClick={() => setShowTokenModal(true)}
                  className="mt-2 text-xs text-red-700 underline hover:no-underline"
                >
                  Add GitHub token for better API access
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PR and issue info */}
      {!isLoading && githubInfo && (
        <>
          {/* Pull Requests */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pull Requests ({githubInfo.pullRequests.length})
            </label>
            {githubInfo.pullRequests.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">
                No PRs found for this commit
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {githubInfo.pullRequests.map((pr) => (
                  <a
                    key={pr.number}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{pr.number}
                          </span>
                          <PRStatusBadge state={pr.state} />
                        </div>
                        <p className="text-sm text-gray-700 truncate mt-1">
                          {pr.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          by {pr.author}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Linked Issues */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Linked Issues ({githubInfo.linkedIssues.length})
            </label>
            {githubInfo.linkedIssues.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">
                No linked issues found
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {githubInfo.linkedIssues.map((issue) => (
                  <a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{issue.number}
                          </span>
                          <IssueStatusBadge state={issue.state} />
                        </div>
                        <p className="text-sm text-gray-700 truncate mt-1">
                          {issue.title}
                        </p>
                        {issue.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {issue.labels.slice(0, 3).map((label) => (
                              <span
                                key={label}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                              >
                                {label}
                              </span>
                            ))}
                            {issue.labels.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{issue.labels.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Not authenticated hint */}
      {!githubToken && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p className="font-medium">Limited API access</p>
          <p className="text-xs mt-1">
            Add a GitHub token for 5000 requests/hour instead of 60.{" "}
            <button
              onClick={() => setShowTokenModal(true)}
              className="underline hover:no-underline"
            >
              Add token
            </button>
          </p>
        </div>
      )}

      <GitHubTokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />
    </div>
  );
}
