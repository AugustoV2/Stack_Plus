import { Router, Response } from 'express';
import { developerRepo, repoRepo, pinRepo } from '../db/index.js';
import { fetchDeveloperProfile } from '../services/github.service.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/developers/recent - Recently viewed developers
router.get('/recent', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recent = await developerRepo.getRecent(8);
    res.json(recent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch recent developers' });
  }
});

// GET /api/developers/:username - Fetch developer profile + repos
router.get('/:username', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const username = req.params.username as string;
    const forceRefresh = req.query.refresh === 'true';

    const result = await fetchDeveloperProfile(username, forceRefresh);
    const userId = req.user?.id;

    // Attach pin status if user is authenticated
    let reposWithPins = result.repos;
    if (userId) {
      const userPins = await pinRepo.findByUserId(userId);
      const pinMap = new Map<number, any>();
      userPins.forEach((pin) => {
        pinMap.set(pin.repo_id, {
          id: pin.id,
          note: pin.note,
          tags: pin.tags,
          created_at: pin.created_at,
        });
      });

      reposWithPins = result.repos.map((repo) => {
        const pinDetails = pinMap.get(repo.id);
        return {
          ...repo,
          is_pinned: !!pinDetails,
          pin_details: pinDetails || null,
        };
      });
    }

    res.json({
      developer: result.developer,
      repos: reposWithPins,
      from_cache: result.fromCache,
    });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: `GitHub developer '${req.params.username}' not found.` });
      return;
    }
    if (err.isRateLimit) {
      res.status(429).json({
        error: 'GitHub API rate limit exceeded. Please wait a moment or configure GITHUB_TOKEN in server/.env.',
        is_rate_limit: true,
      });
      return;
    }
    console.error('Error fetching developer:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch developer profile' });
  }
});

// POST /api/developers/:username/refresh - Force re-fetch from GitHub
router.post('/:username/refresh', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const username = req.params.username as string;
    const result = await fetchDeveloperProfile(username, true);
    res.json({
      message: 'Developer profile refreshed successfully',
      developer: result.developer,
      repos: result.repos,
      from_cache: false,
    });
  } catch (err: any) {
    if (err.isRateLimit) {
      res.status(429).json({
        error: 'GitHub API rate limit exceeded during refresh.',
        is_rate_limit: true,
      });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to refresh developer profile' });
  }
});

export default router;
