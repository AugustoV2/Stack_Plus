"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const github_service_js_1 = require("../services/github.service.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/developers/recent - Recently viewed developers for the active profile
router.get('/recent', auth_js_1.optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            // Return only the developers this logged-in account has searched for
            const recent = await index_js_1.developerRepo.getUserRecent(userId, 8);
            res.json(recent);
            return;
        }
        // For unauthenticated users, return empty list (no personal search history yet)
        res.json([]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch recent developers' });
    }
});
// GET /api/developers/:username - Fetch developer profile + repos
router.get('/:username', auth_js_1.optionalAuth, async (req, res) => {
    try {
        const username = req.params.username;
        const forceRefresh = req.query.refresh === 'true';
        const userId = req.user?.id;
        let userToken;
        if (userId) {
            const user = await index_js_1.userRepo.findById(userId);
            if (user?.github_token) {
                userToken = user.github_token;
            }
        }
        const result = await (0, github_service_js_1.fetchDeveloperProfile)(username, forceRefresh, userToken);
        // If logged in, record this search for this user's profile
        if (userId && result.developer?.id) {
            index_js_1.developerRepo.recordSearch(userId, result.developer.id).catch((e) => {
                console.warn('Failed to record user search history:', e.message);
            });
        }
        // Attach pin status if user is authenticated
        let reposWithPins = result.repos;
        if (userId) {
            const userPins = await index_js_1.pinRepo.findByUserId(userId);
            const pinMap = new Map();
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
    }
    catch (err) {
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
router.post('/:username/refresh', auth_js_1.optionalAuth, async (req, res) => {
    try {
        const username = req.params.username;
        const userId = req.user?.id;
        let userToken;
        if (userId) {
            const user = await index_js_1.userRepo.findById(userId);
            if (user?.github_token) {
                userToken = user.github_token;
            }
        }
        const result = await (0, github_service_js_1.fetchDeveloperProfile)(username, true, userToken);
        res.json({
            message: 'Developer profile refreshed successfully',
            developer: result.developer,
            repos: result.repos,
            from_cache: false,
        });
    }
    catch (err) {
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
exports.default = router;
