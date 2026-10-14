"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password (or PIN) are required' });
            return;
        }
        if (password.length < 4) {
            res.status(400).json({ error: 'Password or PIN must be at least 4 characters long' });
            return;
        }
        const existingUser = await index_js_1.userRepo.findByEmail(email);
        if (existingUser) {
            res.status(409).json({ error: 'An account with this email already exists' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const newUser = await index_js_1.userRepo.create(email, passwordHash);
        const token = (0, auth_js_1.generateToken)({ id: newUser.id, email: newUser.email });
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                created_at: newUser.created_at,
            },
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password (or PIN) are required' });
            return;
        }
        const user = await index_js_1.userRepo.findByEmail(email);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const token = (0, auth_js_1.generateToken)({ id: user.id, email: user.email });
        res.json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Failed to sign in. Please try again.' });
    }
});
router.get('/me', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const user = await index_js_1.userRepo.findById(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch user session' });
    }
});
exports.default = router;
