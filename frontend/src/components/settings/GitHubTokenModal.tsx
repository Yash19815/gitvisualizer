import { useState } from "react";
import { useRepositoryStore } from "../../store/repositoryStore";

interface GitHubTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubTokenModal({ isOpen, onClose }: GitHubTokenModalProps) {
  const { githubToken, setGitHubToken } = useRepositoryStore();
  const [token, setToken] = useState(githubToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await setGitHubToken(token || null);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await setGitHubToken(null);
      setToken("");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            GitHub Integration
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Add a GitHub Personal Access Token to view pull requests and linked
            issues for commits. Without a token, you're limited to 60 API
            requests per hour.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="text-sm font-medium text-blue-800">
              How to create a token:
            </h3>
            <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>
                Go to GitHub Settings → Developer settings → Personal access
                tokens
              </li>
              <li>Click "Generate new token (classic)"</li>
              <li>
                Select scope:{" "}
                <code className="bg-blue-100 px-1 rounded">repo</code> (for
                private repos) or{" "}
                <code className="bg-blue-100 px-1 rounded">public_repo</code>{" "}
                (for public only)
              </li>
              <li>Copy and paste the token below</li>
            </ol>
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Open GitHub Token Settings →
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {githubToken && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Token is configured (5000 requests/hour)
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {githubToken && (
              <button
                onClick={handleRemove}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Remove Token
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
