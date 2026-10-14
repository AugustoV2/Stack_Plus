import { Router, Response } from 'express';
import { developerRepo, comparisonRepo } from '../db/index.js';
import { fetchDeveloperProfile } from '../services/github.service.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Developer } from '../types/index.js';

const router = Router();

// POST /api/compare - Compare multiple developers by username
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { usernames } = req.body;

    if (!Array.isArray(usernames) || usernames.length < 2) {
      res.status(400).json({ error: 'Please provide at least 2 developer usernames to compare.' });
      return;
    }

    const uniqueUsernames = Array.from(new Set(usernames.map((u: string) => u.trim()))).filter(Boolean);

    if (uniqueUsernames.length < 2) {
      res.status(400).json({ error: 'Please provide at least 2 distinct developer usernames.' });
      return;
    }

    // Fetch all developers (uses cache where available, hits GitHub if fresh)
    const devResults = await Promise.allSettled(
      uniqueUsernames.map((u) => fetchDeveloperProfile(u, false))
    );

    const successfulDevs: Developer[] = [];
    const failedUsernames: string[] = [];

    devResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        successfulDevs.push(result.value.developer);
      } else {
        failedUsernames.push(uniqueUsernames[idx]);
      }
    });

    if (successfulDevs.length < 2) {
      res.status(400).json({
        error: `Could not load enough developers to compare. Failed for: ${failedUsernames.join(', ')}`,
        failedUsernames,
      });
      return;
    }

    // Compute Comparative Analytics
    // 1. Language Matrix: gather all unique languages
    const allLanguages = new Set<string>();
    successfulDevs.forEach((dev) => {
      dev.top_languages.forEach((l) => allLanguages.add(l.language));
    });

    const languageMatrix = Array.from(allLanguages).map((lang) => {
      const entry: Record<string, any> = { language: lang };
      successfulDevs.forEach((dev) => {
        const found = dev.top_languages.find((l) => l.language === lang);
        entry[dev.github_username] = found ? found.percentage : 0;
      });
      return entry;
    });

    // 2. Head-to-Head Comparative Overview
    const devSummaries = successfulDevs.map((dev) => {
      const avgStarsPerRepo = dev.public_repos > 0 ? Math.round(dev.total_stars / dev.public_repos) : 0;
      const totalRecentCommits = dev.commit_activity.reduce((acc, c) => acc + c.count, 0);
      const primaryLang = dev.top_languages.length > 0 ? dev.top_languages[0].language : 'Unknown';

      return {
        id: dev.id,
        github_username: dev.github_username,
        name: dev.name,
        avatar_url: dev.avatar_url,
        followers: dev.followers,
        public_repos: dev.public_repos,
        total_stars: dev.total_stars,
        avg_stars_per_repo: avgStarsPerRepo,
        total_recent_commits: totalRecentCommits,
        primary_language: primaryLang,
        top_languages: dev.top_languages,
        commit_activity: dev.commit_activity,
        fetched_at: dev.fetched_at,
      };
    });

    // 3. Combined commit activity timeline for comparison chart
    // Get unique dates
    const dateSet = new Set<string>();
    successfulDevs.forEach((dev) => {
      dev.commit_activity.forEach((c) => dateSet.add(c.date));
    });

    const sortedDates = Array.from(dateSet).sort();
    const timelineData = sortedDates.map((date) => {
      const item: Record<string, any> = { date };
      successfulDevs.forEach((dev) => {
        const entry = dev.commit_activity.find((c) => c.date === date);
        item[dev.github_username] = entry ? entry.count : 0;
      });
      return item;
    });

    res.json({
      developers: devSummaries,
      language_matrix: languageMatrix,
      commit_timeline: timelineData,
      failed_usernames: failedUsernames,
    });
  } catch (err: any) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: 'Failed to compute comparison analytics.' });
  }
});

// GET /api/comparisons - List saved comparisons for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comparisons = await comparisonRepo.findByUserId(req.user!.id);
    res.json(comparisons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve saved comparisons.' });
  }
});

// POST /api/comparisons - Save a comparison
router.post('/save', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, usernames, developerIds } = req.body;

    if (!name || (!usernames && !developerIds)) {
      res.status(400).json({ error: 'Comparison name and developer list are required.' });
      return;
    }

    let devIds: number[] = developerIds || [];

    if (usernames && usernames.length > 0) {
      devIds = [];
      for (const u of usernames) {
        const dev = await developerRepo.findByUsername(u);
        if (dev) {
          devIds.push(dev.id);
        }
      }
    }

    if (devIds.length < 2) {
      res.status(400).json({ error: 'At least 2 valid developers are required to save a comparison.' });
      return;
    }

    const saved = await comparisonRepo.create(req.user!.id, name.trim(), devIds);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Save comparison error:', err);
    res.status(500).json({ error: 'Failed to save comparison.' });
  }
});

// GET /api/comparisons/:id - Retrieve specific saved comparison
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const comparison = await comparisonRepo.findById(id, req.user!.id);

    if (!comparison) {
      res.status(404).json({ error: 'Saved comparison not found.' });
      return;
    }

    res.json(comparison);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve comparison.' });
  }
});

// DELETE /api/comparisons/:id - Delete a saved comparison
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const deleted = await comparisonRepo.delete(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'Saved comparison not found or already deleted.' });
      return;
    }

    res.json({ message: 'Comparison deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete comparison.' });
  }
});

export default router;
