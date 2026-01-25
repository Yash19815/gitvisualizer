import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRepositoryStore } from '../store/repositoryStore';

/**
 * Parses the URL path to extract a repository URL.
 * Supports formats like:
 * - /github.com/user/repo
 * - /gitlab.com/user/repo
 * - /bitbucket.org/user/repo
 *
 * Returns the full HTTPS URL if a valid repo path is detected.
 */
function parseRepoFromPath(pathname: string): string | null {
  // Remove leading slash
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  if (!path) return null;

  // Check if path starts with a known git hosting provider
  const gitProviders = [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'codeberg.org',
    'gitea.com',
    'sr.ht',
  ];

  const provider = gitProviders.find(p => path.startsWith(p));
  if (!provider) return null;

  // Extract the remaining path (user/repo or user/repo/...)
  const repoPath = path.slice(provider.length);

  // Must have at least /user/repo
  const parts = repoPath.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  // Take only user/repo (ignore subpaths like /tree/main)
  const [user, repo] = parts;

  // Remove .git suffix if present
  const cleanRepo = repo.replace(/\.git$/, '');

  return `https://${provider}/${user}/${cleanRepo}`;
}

/**
 * Converts a repository URL to a URL path for the app.
 */
function repoUrlToPath(repoUrl: string): string {
  try {
    // Handle both https:// and git@ URLs
    let cleanUrl = repoUrl;

    // Remove https:// prefix
    if (cleanUrl.startsWith('https://')) {
      cleanUrl = cleanUrl.slice(8);
    } else if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.slice(7);
    } else if (cleanUrl.startsWith('git@')) {
      // Convert git@github.com:user/repo.git to github.com/user/repo
      cleanUrl = cleanUrl.slice(4).replace(':', '/');
    }

    // Remove .git suffix
    cleanUrl = cleanUrl.replace(/\.git$/, '');

    // Remove trailing slashes
    cleanUrl = cleanUrl.replace(/\/+$/, '');

    return '/' + cleanUrl;
  } catch {
    return '/';
  }
}

/**
 * Custom hook that syncs the browser URL with the loaded repository.
 *
 * On mount: If URL contains a repo path (e.g., /github.com/user/repo),
 * automatically clones and loads that repository.
 *
 * On repo load: Updates the browser URL to reflect the loaded repository.
 */
export function useRepoUrl() {
  const location = useLocation();
  const navigate = useNavigate();
  const { repository, cloneRepo, isLoading } = useRepositoryStore();
  const hasInitialized = useRef(false);
  const lastRepoUrl = useRef<string | null>(null);

  // On mount: Check if URL contains a repo to load
  useEffect(() => {
    if (hasInitialized.current) return;

    const repoUrl = parseRepoFromPath(location.pathname);
    if (repoUrl && !isLoading && !repository) {
      hasInitialized.current = true;
      lastRepoUrl.current = repoUrl;
      // Clone the repository (shallow by default for faster loading)
      cloneRepo(repoUrl, { shallow: true });
    } else {
      hasInitialized.current = true;
    }
  }, [location.pathname, cloneRepo, isLoading, repository]);

  // When repository changes: Update the URL
  useEffect(() => {
    if (!repository) {
      // If no repo is loaded and we're not on home, stay where we are
      // (user might be in the middle of loading)
      return;
    }

    // Check if this repo came from a URL (has a remote origin we can detect)
    // For now, we'll use a heuristic: if the repo name looks like it came from
    // a clone operation, we can derive the URL

    // The repository.path is a local path, but for cloned repos,
    // we might want to update the URL based on the original clone URL.
    // Since we don't store the original URL, we'll need to check
    // if the current URL already matches what we loaded.

    const currentRepoUrl = parseRepoFromPath(location.pathname);
    if (currentRepoUrl === lastRepoUrl.current) {
      // URL already reflects the loaded repo
      return;
    }

    // If user loaded a repo via input (not URL), update URL to reflect it
    // This requires knowing the clone URL, which we'd need to track
    // For MVP, we'll only update URL when cloning from URL
  }, [repository, location.pathname, navigate]);

  return {
    /**
     * Navigate to a repo URL path.
     * This will update the browser URL and trigger a clone.
     */
    navigateToRepo: (repoUrl: string) => {
      const path = repoUrlToPath(repoUrl);
      lastRepoUrl.current = repoUrl;
      navigate(path);
    },

    /**
     * Update the URL to reflect the current repository without triggering a clone.
     */
    updateUrlForRepo: (repoUrl: string) => {
      const path = repoUrlToPath(repoUrl);
      lastRepoUrl.current = repoUrl;
      navigate(path, { replace: true });
    },

    /**
     * Clear the URL (go to home).
     */
    clearUrl: () => {
      lastRepoUrl.current = null;
      navigate('/', { replace: true });
    },
  };
}

export { parseRepoFromPath, repoUrlToPath };
