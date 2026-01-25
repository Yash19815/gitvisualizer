import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { repositoryRoutes } from './routes/repository.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { githubRoutes } from './routes/github.routes.js';

export const app = express();

app.use(cors());
app.use(compression()); // Enable gzip compression for all responses
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', repositoryRoutes);
app.use('/api', uploadRoutes);
app.use('/api', githubRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});
