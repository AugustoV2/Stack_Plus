"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDb = ensureDb;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_js_1 = require("./db/index.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const developer_routes_js_1 = __importDefault(require("./routes/developer.routes.js"));
const compare_routes_js_1 = __importDefault(require("./routes/compare.routes.js"));
const pin_routes_js_1 = __importDefault(require("./routes/pin.routes.js"));
const system_routes_js_1 = __importDefault(require("./routes/system.routes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// CORS setup to allow client
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json());
// Request logger
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// Initialize database connection
let dbInitPromise = null;
function ensureDb() {
    if (!dbInitPromise) {
        dbInitPromise = (0, index_js_1.initDatabase)().catch((err) => {
            console.error('Database connection / init error:', err);
        });
    }
    return dbInitPromise;
}
// Start database connection immediately in background
ensureDb();
// In serverless environments, ensure DB is connected before processing any requests
app.use(async (_req, _res, next) => {
    try {
        await ensureDb();
        next();
    }
    catch (err) {
        next(err);
    }
});
// Route registration
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/developers', developer_routes_js_1.default);
app.use('/api/compare', compare_routes_js_1.default);
app.use('/api/comparisons', compare_routes_js_1.default);
app.use('/api/pins', pin_routes_js_1.default);
app.use('/api/system', system_routes_js_1.default);
// Health check root
app.get('/api', (_req, res) => {
    res.json({
        app: 'StackPulse API',
        version: '1.0.0',
        description: 'Developer Intelligence & Head-to-Head Comparison Platform',
        endpoints: [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/me',
            '/api/developers/:username',
            '/api/developers/recent',
            '/api/compare',
            '/api/comparisons',
            '/api/pins',
            '/api/system/rate-limit',
        ],
    });
});
async function startServer() {
    try {
        await ensureDb();
        app.listen(PORT, () => {
            console.log(`🚀 StackPulse Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Fatal error starting StackPulse server:', err);
        process.exit(1);
    }
}
// Only listen on TCP port if not running as a Vercel Serverless Function
if (!process.env.VERCEL) {
    startServer();
}
exports.default = app;
