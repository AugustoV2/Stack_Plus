import { Router, Request, Response } from 'express';
import { getRateLimitStatus } from '../services/github.service.js';

const router = Router();

router.get('/rate-limit', (_req: Request, res: Response) => {
  const status = getRateLimitStatus();
  res.json({
    ...status,
    authenticated: !!process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here',
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
