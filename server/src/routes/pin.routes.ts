import { Router, Response } from 'express';
import { pinRepo, repoRepo } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/pins - Get all pinned repositories for logged in user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pins = await pinRepo.findByUserId(req.user!.id);
    res.json(pins);
  } catch (err: any) {
    console.error('Fetch pins error:', err);
    res.status(500).json({ error: 'Failed to retrieve pinned repositories.' });
  }
});

// POST /api/pins - Pin a repository, with optional note and tags
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { repoId, note, tags } = req.body;

    if (!repoId) {
      res.status(400).json({ error: 'repoId is required to pin a repository.' });
      return;
    }

    const repo = await repoRepo.findById(repoId);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found.' });
      return;
    }

    const pin = await pinRepo.createOrUpdate(req.user!.id, repoId, note, tags);
    res.status(201).json({
      message: 'Repository pinned successfully',
      pin,
    });
  } catch (err: any) {
    console.error('Create pin error:', err);
    res.status(500).json({ error: 'Failed to pin repository.' });
  }
});

// PUT /api/pins/:id - Update note or tags
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { note, tags, repoId } = req.body;

    let targetRepoId = repoId;
    if (!targetRepoId) {
      const userPins = await pinRepo.findByUserId(req.user!.id);
      const existing = userPins.find((p) => p.id === id);
      if (!existing) {
        res.status(404).json({ error: 'Pin not found.' });
        return;
      }
      targetRepoId = existing.repo_id;
    }

    const updated = await pinRepo.createOrUpdate(req.user!.id, targetRepoId, note, tags);
    res.json({
      message: 'Pin updated successfully',
      pin: updated,
    });
  } catch (err: any) {
    console.error('Update pin error:', err);
    res.status(500).json({ error: 'Failed to update pin.' });
  }
});

// DELETE /api/pins/:id - Delete pin by pin ID
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const deleted = await pinRepo.delete(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'Pin not found or already deleted.' });
      return;
    }

    res.json({ message: 'Repository unpinned successfully.' });
  } catch (err: any) {
    console.error('Delete pin error:', err);
    res.status(500).json({ error: 'Failed to unpin repository.' });
  }
});

// DELETE /api/pins/repo/:repoId - Unpin directly by repository ID
router.delete('/repo/:repoId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repoId = parseInt(req.params.repoId as string, 10);
    const deleted = await pinRepo.deleteByRepo(repoId, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'Pin not found for this repository.' });
      return;
    }

    res.json({ message: 'Repository unpinned successfully.' });
  } catch (err: any) {
    console.error('Delete pin by repo error:', err);
    res.status(500).json({ error: 'Failed to unpin repository.' });
  }
});

export default router;
