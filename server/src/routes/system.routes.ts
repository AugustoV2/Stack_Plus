import { Router, Response } from 'express';
import {
  getRateLimitForToken,
  verifyGithubToken,
} from '../services/github.service.js';
import { userRepo } from '../db/index.js';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/system/rate-limit - Account-profile-specific rate limit
router.get('/rate-limit', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    let userToken: string | null = null;
    if (req.user?.id) {
      const user = await userRepo.findById(req.user.id);
      if (user?.github_token) {
        userToken = user.github_token;
      }
    }

    const status = await getRateLimitForToken(userToken);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      limit: 60,
      remaining: 60,
      resetTime: new Date(Date.now() + 3600000).toISOString(),
      authenticated: false,
    });
  }
});

router.get('/health', (_req: AuthRequest, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET /api/system/token - Check configured token status for the logged-in user profile
router.get('/token', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.json({ configured: false, authenticatedUser: false });
      return;
    }

    const user = await userRepo.findById(req.user.id);
    const token = user?.github_token;
    if (!token) {
      res.json({ configured: false, authenticatedUser: true });
      return;
    }

    const masked = token.length > 8 ? `${token.slice(0, 4)}••••••••${token.slice(-4)}` : '••••••••';
    res.json({
      configured: true,
      authenticatedUser: true,
      maskedToken: masked,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check token status.' });
  }
});

// POST /api/system/token - Save new GitHub Personal Access Token to current user's profile
router.post('/token', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Save to user profile in PostgreSQL database
    await userRepo.updateGithubToken(req.user!.id, cleanToken);

    res.json({
      message: 'GitHub Personal Access Token verified and saved to your account profile!',
      quota: newQuota,
      configured: true,
    });
  } catch (err: any) {
    console.error('Save token error:', err);
    res.status(500).json({ error: 'Failed to save GitHub token to account.' });
  }
});

// DELETE /api/system/token - Remove token from current user's account profile
router.delete('/token', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await userRepo.updateGithubToken(req.user!.id, null);
    res.json({
      message: 'GitHub token removed from your account profile.',
      configured: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove GitHub token from account.' });
  }
});

export default router;
