import { Router, Request, Response } from 'express';
import {
  getRateLimitStatus,
  setRuntimeGithubToken,
  getRuntimeGithubToken,
  verifyGithubToken,
} from '../services/github.service.js';
import { settingsRepo } from '../db/index.js';

const router = Router();

router.get('/rate-limit', (_req: Request, res: Response) => {
  const status = getRateLimitStatus();
  const currentToken = getRuntimeGithubToken();
  res.json({
    ...status,
    authenticated: !!currentToken && currentToken !== 'your_github_personal_access_token_here',
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET /api/system/token - Check configured token status
router.get('/token', async (_req: Request, res: Response) => {
  try {
    const token = getRuntimeGithubToken() || (await settingsRepo.get('github_token'));
    if (!token) {
      res.json({ configured: false });
      return;
    }
    const masked = token.length > 8 ? `${token.slice(0, 4)}••••••••${token.slice(-4)}` : '••••••••';
    res.json({
      configured: true,
      maskedToken: masked,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check token status.' });
  }
});

// POST /api/system/token - Save new GitHub Personal Access Token to database
router.post('/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      res.status(400).json({ error: 'Please enter a valid GitHub Personal Access Token.' });
      return;
    }

    const cleanToken = token.trim();

    // Verify token with live GitHub API rate_limit endpoint
    let newQuota;
    try {
      newQuota = await verifyGithubToken(cleanToken);
    } catch (verifyErr: any) {
      res.status(400).json({
        error: `GitHub rejected this token: ${verifyErr.message || 'Unauthorized'}. Please make sure you copied the entire token correctly.`,
      });
      return;
    }

    // Save to database permanently
    await settingsRepo.set('github_token', cleanToken);
    setRuntimeGithubToken(cleanToken);

    res.json({
      message: 'GitHub Personal Access Token verified and saved securely in your database!',
      quota: newQuota,
      configured: true,
    });
  } catch (err: any) {
    console.error('Save token error:', err);
    res.status(500).json({ error: 'Failed to save GitHub token.' });
  }
});

// DELETE /api/system/token - Remove custom token and return to default quota
router.delete('/token', async (_req: Request, res: Response) => {
  try {
    await settingsRepo.delete('github_token');
    setRuntimeGithubToken('');
    res.json({
      message: 'GitHub token removed from database.',
      configured: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove GitHub token.' });
  }
});

export default router;
