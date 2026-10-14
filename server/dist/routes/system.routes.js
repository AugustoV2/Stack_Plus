"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const github_service_js_1 = require("../services/github.service.js");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/system/rate-limit - Account-profile-specific rate limit
router.get('/rate-limit', auth_js_1.optionalAuth, async (req, res) => {
    try {
        let userToken = null;
        if (req.user?.id) {
            const user = await index_js_1.userRepo.findById(req.user.id);
            if (user?.github_token) {
                userToken = user.github_token;
            }
        }
        const status = await (0, github_service_js_1.getRateLimitForToken)(userToken);
        res.json(status);
    }
    catch (err) {
        res.status(500).json({
            limit: 60,
            remaining: 60,
            resetTime: new Date(Date.now() + 3600000).toISOString(),
            authenticated: false,
        });
    }
});
router.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: (0, index_js_1.getDbDiagnostic)(),
    });
});
// GET /api/system/token - Check configured token status for the logged-in user profile
router.get('/token', auth_js_1.optionalAuth, async (req, res) => {
    try {
        if (!req.user?.id) {
            res.json({ configured: false, authenticatedUser: false });
            return;
        }
        const user = await index_js_1.userRepo.findById(req.user.id);
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check token status.' });
    }
});
// POST /api/system/token - Save new GitHub Personal Access Token to current user's profile
router.post('/token', auth_js_1.authenticateToken, async (req, res) => {
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
            newQuota = await (0, github_service_js_1.verifyGithubToken)(cleanToken);
        }
        catch (verifyErr) {
            res.status(400).json({
                error: `GitHub rejected this token: ${verifyErr.message || 'Unauthorized'}. Please make sure you copied the entire token correctly.`,
            });
            return;
        }
        // Save to user profile in PostgreSQL database
        await index_js_1.userRepo.updateGithubToken(req.user.id, cleanToken);
        res.json({
            message: 'GitHub Personal Access Token verified and saved to your account profile!',
            quota: newQuota,
            configured: true,
        });
    }
    catch (err) {
        console.error('Save token error:', err);
        res.status(500).json({ error: 'Failed to save GitHub token to account.' });
    }
});
// DELETE /api/system/token - Remove token from current user's account profile
router.delete('/token', auth_js_1.authenticateToken, async (req, res) => {
    try {
        await index_js_1.userRepo.updateGithubToken(req.user.id, null);
        res.json({
            message: 'GitHub token removed from your account profile.',
            configured: false,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to remove GitHub token from account.' });
    }
});
exports.default = router;
