"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'stackpulse-super-secret-jwt-key-2026';
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Access token required. Please sign in.' });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || !decoded) {
            res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
            return;
        }
        req.user = { id: decoded.id, email: decoded.email };
        next();
    });
}
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err && decoded) {
            req.user = { id: decoded.id, email: decoded.email };
        }
        next();
    });
}
function generateToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
    });
}
