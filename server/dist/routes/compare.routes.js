"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const github_service_js_1 = require("../services/github.service.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// POST /api/compare - Compare multiple developers by username
router.post('/', auth_js_1.optionalAuth, async (req, res) => {
    try {
        const { usernames } = req.body;
        if (!Array.isArray(usernames) || usernames.length < 2) {
            res.status(400).json({ error: 'Please provide at least 2 developer usernames to compare.' });
            return;
        }
        const uniqueUsernames = Array.from(new Set(usernames.map((u) => u.trim()))).filter(Boolean);
        if (uniqueUsernames.length < 2) {
            res.status(400).json({ error: 'Please provide at least 2 distinct developer usernames.' });
            return;
        }
        let userToken;
        if (req.user?.id) {
            const user = await index_js_1.userRepo.findById(req.user.id);
            if (user?.github_token) {
                userToken = user.github_token;
            }
        }
        // Fetch all developers (uses cache where available, hits GitHub if fresh)
        const devResults = await Promise.allSettled(uniqueUsernames.map((u) => (0, github_service_js_1.fetchDeveloperProfile)(u, false, userToken)));
        const successfulDevs = [];
        const failedUsernames = [];
        devResults.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                successfulDevs.push(result.value.developer);
            }
            else {
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
        const allLanguages = new Set();
        successfulDevs.forEach((dev) => {
            dev.top_languages.forEach((l) => allLanguages.add(l.language));
        });
        const languageMatrix = Array.from(allLanguages).map((lang) => {
            const entry = { language: lang };
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
        const dateSet = new Set();
        successfulDevs.forEach((dev) => {
            dev.commit_activity.forEach((c) => dateSet.add(c.date));
        });
        const sortedDates = Array.from(dateSet).sort();
        const timelineData = sortedDates.map((date) => {
            const item = { date };
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
    }
    catch (err) {
        console.error('Comparison error:', err);
        res.status(500).json({ error: 'Failed to compute comparison analytics.' });
    }
});
// GET /api/comparisons - List saved comparisons for current user
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const comparisons = await index_js_1.comparisonRepo.findByUserId(req.user.id);
        res.json(comparisons);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve saved comparisons.' });
    }
});
// POST /api/comparisons - Save a comparison
router.post('/save', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { name, usernames, developerIds } = req.body;
        if (!name || (!usernames && !developerIds)) {
            res.status(400).json({ error: 'Comparison name and developer list are required.' });
            return;
        }
        let devIds = developerIds || [];
        if (usernames && usernames.length > 0) {
            devIds = [];
            for (const u of usernames) {
                const dev = await index_js_1.developerRepo.findByUsername(u);
                if (dev) {
                    devIds.push(dev.id);
                }
            }
        }
        if (devIds.length < 2) {
            res.status(400).json({ error: 'At least 2 valid developers are required to save a comparison.' });
            return;
        }
        const saved = await index_js_1.comparisonRepo.create(req.user.id, name.trim(), devIds);
        res.status(201).json(saved);
    }
    catch (err) {
        console.error('Save comparison error:', err);
        res.status(500).json({ error: 'Failed to save comparison.' });
    }
});
// GET /api/comparisons/:id - Retrieve specific saved comparison
router.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const comparison = await index_js_1.comparisonRepo.findById(id, req.user.id);
        if (!comparison) {
            res.status(404).json({ error: 'Saved comparison not found.' });
            return;
        }
        res.json(comparison);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve comparison.' });
    }
});
// DELETE /api/comparisons/:id - Delete a saved comparison
router.delete('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const deleted = await index_js_1.comparisonRepo.delete(id, req.user.id);
        if (!deleted) {
            res.status(404).json({ error: 'Saved comparison not found or already deleted.' });
            return;
        }
        res.json({ message: 'Comparison deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete comparison.' });
    }
});
exports.default = router;
