import { useState, type FormEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRepositoryStore } from "../../store/repositoryStore";
import { isGitUrl } from "../../api/gitApi";
import { repoUrlToPath } from "../../hooks/useRepoUrl";

export function PathInput() {
  const [input, setInput] = useState("");
  const [fullClone, setFullClone] = useState(false);
  const { loadRepo, cloneRepo, isLoading, error, repository } =
    useRepositoryStore();
  const navigate = useNavigate();

  const inputType = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    return isGitUrl(trimmed) ? "url" : "path";
  }, [input]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (inputType === "url") {
      // Update URL to reflect the repo being loaded
      const urlPath = repoUrlToPath(trimmed);
      navigate(urlPath, { replace: true });

      await cloneRepo(trimmed, { shallow: !fullClone });
    } else {
      await loadRepo(trimmed);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter path or GitHub URL (e.g., /home/user/project or https://github.com/user/repo)"
            className={`
              w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-400 dark:placeholder-gray-500
              ${error ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"}
            `}
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {inputType === "url" && !repository && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                URL
              </span>
            )}
            {inputType === "path" && !repository && input.trim() && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Path
              </span>
            )}
            {repository && (
              <span className="text-green-500">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${
              isLoading || !input.trim()
                ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : inputType === "url"
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {inputType === "url" ? "Cloning..." : "Loading..."}
            </span>
          ) : inputType === "url" ? (
            "Clone & Visualize"
          ) : (
            "Visualize"
          )}
        </button>
      </form>

      {/* Clone options - only show when URL is detected */}
      {inputType === "url" && !repository && (
        <div className="flex items-center gap-4 pl-1">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={fullClone}
              onChange={(e) => setFullClone(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
            />
            <span>Clone full history</span>
          </label>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {fullClone
              ? "(Downloads complete history - slower but shows all commits)"
              : "(Downloads recent 500 commits - faster)"}
          </span>
        </div>
      )}
    </div>
  );
}
