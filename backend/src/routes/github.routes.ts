import { Router, Request, Response } from 'express';
import { githubService } from '../services/github.service.js';
import { gitService } from '../services/git.service.js';
import { validatePath } from '../middleware/validatePath.js';

export const githubRoutes = Router();

// Set GitHub token for authenticated requests
githubRoutes.post('/github/config', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (token && typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Token must be a string' });
      return;
    }

    githubService.setToken(token || null);
    res.json({ success: true, hasToken: !!token });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get rate limit status
githubRoutes.get('/github/rate-limit', async (_req: Request, res: Response) => {
  try {
    const status = await githubService.getRateLimitStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get GitHub repo info from repository remote URLs
githubRoutes.post('/github/repo-info', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Not a valid git repository' });
      return;
    }

    const remotes = await gitService.getRemoteUrls(path);

    // Try to find a GitHub remote (prefer 'origin')
    const originRemote = remotes.find(r => r.name === 'origin');
    const remoteUrl = originRemote?.url || remotes[0]?.url;

    if (!remoteUrl) {
      res.json({
        success: true,
        data: { isGitHub: false, owner: null, repo: null },
      });
      return;
    }

    const repoInfo = githubService.parseRemoteUrl(remoteUrl);

    if (!repoInfo) {
      res.json({
        success: true,
        data: { isGitHub: false, owner: null, repo: null },
      });
      return;
    }

    res.json({ success: true, data: repoInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get GitHub info (PRs and issues) for a specific commit
githubRoutes.post('/github/commit/:hash', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const { hash } = req.params;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Not a valid git repository' });
      return;
    }

    // Get commit details
    const commit = await gitService.getCommitDetails(path, hash);
    if (!commit) {
      res.status(404).json({ success: false, error: 'Commit not found' });
      return;
    }

    // Get GitHub repo info
    const remotes = await gitService.getRemoteUrls(path);
    const originRemote = remotes.find(r => r.name === 'origin');
    const remoteUrl = originRemote?.url || remotes[0]?.url;

    if (!remoteUrl) {
      res.json({
        success: true,
        data: { pullRequests: [], linkedIssues: [] },
        warning: 'No remote URL found',
      });
      return;
    }

    const repoInfo = githubService.parseRemoteUrl(remoteUrl);

    if (!repoInfo) {
      res.json({
        success: true,
        data: { pullRequests: [], linkedIssues: [] },
        warning: 'Repository is not hosted on GitHub',
      });
      return;
    }

    // Fetch GitHub info
    const githubInfo = await githubService.getCommitGitHubInfo(
      repoInfo.owner,
      repoInfo.repo,
      {
        hash: commit.hash,
        message: commit.message,
        body: commit.body,
      }
    );

    res.json({ success: true, data: githubInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Stream GitHub info with progress updates (SSE)
githubRoutes.post('/github/commit/:hash/stream', validatePath, async (req: Request, res: Response) => {
  const path = req.body.validatedPath;
  const { hash } = req.params;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('progress', { step: 'validate', status: 'start', message: 'Validating repository...' });

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      sendEvent('error', { message: 'Not a valid git repository' });
      res.end();
      return;
    }
    sendEvent('progress', { step: 'validate', status: 'success', message: 'Repository validated' });

    // Get commit details
    sendEvent('progress', { step: 'commit', status: 'start', message: 'Loading commit details...' });
    const commit = await gitService.getCommitDetails(path, hash);
    if (!commit) {
      sendEvent('error', { message: 'Commit not found' });
      res.end();
      return;
    }
    sendEvent('progress', { step: 'commit', status: 'success', message: `Loaded commit ${commit.hash.substring(0, 7)}` });

    // Get GitHub repo info
    sendEvent('progress', { step: 'remote', status: 'start', message: 'Checking remote URLs...' });
    const remotes = await gitService.getRemoteUrls(path);
    const originRemote = remotes.find(r => r.name === 'origin');
    const remoteUrl = originRemote?.url || remotes[0]?.url;

    if (!remoteUrl) {
      sendEvent('progress', { step: 'remote', status: 'error', message: 'No remote URL found' });
      sendEvent('complete', { data: { pullRequests: [], linkedIssues: [] } });
      res.end();
      return;
    }

    const repoInfo = githubService.parseRemoteUrl(remoteUrl);

    if (!repoInfo) {
      sendEvent('progress', { step: 'remote', status: 'error', message: 'Repository is not hosted on GitHub' });
      sendEvent('complete', { data: { pullRequests: [], linkedIssues: [] } });
      res.end();
      return;
    }

    sendEvent('progress', { step: 'remote', status: 'success', message: `Found GitHub repo: ${repoInfo.owner}/${repoInfo.repo}` });

    // Fetch GitHub info with progress callback
    const githubInfo = await githubService.getCommitGitHubInfo(
      repoInfo.owner,
      repoInfo.repo,
      {
        hash: commit.hash,
        message: commit.message,
        body: commit.body,
      },
      (step, status, message, data) => {
        sendEvent('progress', { step, status, message, data });
      }
    );

    sendEvent('complete', { data: githubInfo });
    res.end();
  } catch (error) {
    sendEvent('error', { message: (error as Error).message });
    res.end();
  }
});
