import { Router, Request, Response } from 'express';
import { gitService } from '../services/git.service.js';
import { validatePath } from '../middleware/validatePath.js';

export const repositoryRoutes = Router();

repositoryRoutes.get('/repository/validate', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const isValid = await gitService.validateRepository(path);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get repository stats (commit count, recommended mode) - fast endpoint for large repo detection
repositoryRoutes.post('/repository/stats', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ error: 'Not a valid git repository' });
      return;
    }

    const stats = await gitService.getRepoStats(path);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get repository metadata (branches, tags, stats) without commits
repositoryRoutes.post('/repository/metadata', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ error: 'Not a valid git repository' });
      return;
    }

    const metadata = await gitService.getRepositoryMetadata(path);
    res.json({ success: true, data: metadata });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

repositoryRoutes.post('/repository/load', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ error: 'Not a valid git repository' });
      return;
    }

    const repository = await gitService.getRepository(path);
    res.json({ success: true, data: repository });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// SSE endpoint for streaming commits in chunks
repositoryRoutes.post('/repository/stream', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const chunkSize = parseInt(req.query.chunkSize as string) || 500;
    const firstParent = req.query.firstParent === 'true';

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ error: 'Not a valid git repository' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send metadata first
    const metadata = await gitService.getRepositoryMetadata(path);
    res.write(`event: metadata\ndata: ${JSON.stringify(metadata)}\n\n`);

    // Stream commits in chunks
    for await (const chunk of gitService.streamCommits(path, { chunkSize, firstParent })) {
      res.write(`event: commits\ndata: ${JSON.stringify(chunk)}\n\n`);
    }

    // Signal completion
    res.write(`event: complete\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    // Send error as SSE event
    res.write(`event: error\ndata: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
    res.end();
  }
});

repositoryRoutes.post('/repository/commits', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const maxCount = parseInt(req.query.maxCount as string) || 500;
    const skip = parseInt(req.query.skip as string) || 0;
    const firstParent = req.query.firstParent === 'true';

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ error: 'Not a valid git repository' });
      return;
    }

    const result = await gitService.getCommitsPaginated(path, { maxCount, skip, firstParent });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

repositoryRoutes.get('/commit/:hash', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const { hash } = req.params;

    const commit = await gitService.getCommitDetails(path, hash);
    if (!commit) {
      res.status(404).json({ error: 'Commit not found' });
      return;
    }

    res.json({ commit });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get diff stats for a commit (changed files with additions/deletions)
repositoryRoutes.post('/commit/:hash/diff-stats', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const { hash } = req.params;

    const stats = await gitService.getCommitDiffStats(path, hash);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get detailed diff for a specific file in a commit
repositoryRoutes.post('/commit/:hash/file-diff', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const { hash } = req.params;
    const filePath = req.query.filePath as string;

    if (!filePath) {
      res.status(400).json({ success: false, error: 'filePath query parameter is required' });
      return;
    }

    const diff = await gitService.getFileDiff(path, hash, filePath);
    res.json({ success: true, data: diff });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get file tree at a specific commit
repositoryRoutes.post('/commit/:hash/tree', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const { hash } = req.params;
    const treePath = (req.query.treePath as string) || '';

    const tree = await gitService.getFileTree(path, hash, treePath);
    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get file content at a specific commit
repositoryRoutes.post('/commit/:hash/file', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const { hash } = req.params;
    const filePath = req.query.filePath as string;

    if (!filePath) {
      res.status(400).json({ success: false, error: 'filePath query parameter is required' });
      return;
    }

    const content = await gitService.getFileContent(path, hash, filePath);
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get contributor statistics
repositoryRoutes.post('/repository/contributors', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Not a valid git repository' });
      return;
    }

    const contributors = await gitService.getContributorStats(path);
    res.json({ success: true, data: contributors });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get activity heatmap data
repositoryRoutes.post('/repository/activity', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;
    const days = parseInt(req.query.days as string) || 365;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Not a valid git repository' });
      return;
    }

    const activity = await gitService.getActivityHeatmap(path, days);
    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get submodules list
repositoryRoutes.post('/repository/submodules', validatePath, async (req: Request, res: Response) => {
  try {
    const path = req.body.validatedPath;

    const isValid = await gitService.validateRepository(path);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Not a valid git repository' });
      return;
    }

    const submodules = await gitService.getSubmodules(path);
    res.json({ success: true, data: submodules });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

repositoryRoutes.post('/repository/clone', async (req: Request, res: Response) => {
  try {
    const { url, shallow = true } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    if (!gitService.validateGitUrl(url)) {
      res.status(400).json({ error: 'Invalid git repository URL. Supported: GitHub, GitLab, Bitbucket, or any public .git URL' });
      return;
    }

    // Clone the repository with specified depth option
    const repoPath = await gitService.cloneRepository(url, { shallow });

    // Get repository data
    const repository = await gitService.getRepository(repoPath);

    res.json({ success: true, data: repository });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
