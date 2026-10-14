"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/pins - Get all pinned repositories for logged in user
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const pins = await index_js_1.pinRepo.findByUserId(req.user.id);
        res.json(pins);
    }
    catch (err) {
        console.error('Fetch pins error:', err);
        res.status(500).json({ error: 'Failed to retrieve pinned repositories.' });
    }
});
// POST /api/pins - Pin a repository, with optional note and tags
router.post('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { repoId, note, tags } = req.body;
        if (!repoId) {
            res.status(400).json({ error: 'repoId is required to pin a repository.' });
            return;
        }
        const repo = await index_js_1.repoRepo.findById(repoId);
        if (!repo) {
            res.status(404).json({ error: 'Repository not found.' });
            return;
        }
        const pin = await index_js_1.pinRepo.createOrUpdate(req.user.id, repoId, note, tags);
        res.status(201).json({
            message: 'Repository pinned successfully',
            pin,
        });
    }
    catch (err) {
        console.error('Create pin error:', err);
        res.status(500).json({ error: 'Failed to pin repository.' });
    }
});
// PUT /api/pins/:id - Update note or tags
router.put('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { note, tags, repoId } = req.body;
        let targetRepoId = repoId;
        if (!targetRepoId) {
            const userPins = await index_js_1.pinRepo.findByUserId(req.user.id);
            const existing = userPins.find((p) => p.id === id);
            if (!existing) {
                res.status(404).json({ error: 'Pin not found.' });
                return;
            }
            targetRepoId = existing.repo_id;
        }
        const updated = await index_js_1.pinRepo.createOrUpdate(req.user.id, targetRepoId, note, tags);
        res.json({
            message: 'Pin updated successfully',
            pin: updated,
        });
    }
    catch (err) {
        console.error('Update pin error:', err);
        res.status(500).json({ error: 'Failed to update pin.' });
    }
});
// DELETE /api/pins/:id - Delete pin by pin ID
router.delete('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const deleted = await index_js_1.pinRepo.delete(id, req.user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Pin not found or already deleted.' });
            return;
        }
        res.json({ message: 'Repository unpinned successfully.' });
    }
    catch (err) {
        console.error('Delete pin error:', err);
        res.status(500).json({ error: 'Failed to unpin repository.' });
    }
});
// DELETE /api/pins/repo/:repoId - Unpin directly by repository ID
router.delete('/repo/:repoId', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId, 10);
        const deleted = await index_js_1.pinRepo.deleteByRepo(repoId, req.user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Pin not found for this repository.' });
            return;
        }
        res.json({ message: 'Repository unpinned successfully.' });
    }
    catch (err) {
        console.error('Delete pin by repo error:', err);
        res.status(500).json({ error: 'Failed to unpin repository.' });
    }
});
exports.default = router;
