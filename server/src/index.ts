import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/index.js';
import authRoutes from './routes/auth.routes.js';
import developerRoutes from './routes/developer.routes.js';
import compareRoutes from './routes/compare.routes.js';
import pinRoutes from './routes/pin.routes.js';
import systemRoutes from './routes/system.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow client
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/comparisons', compareRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/system', systemRoutes);

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

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 StackPulse Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal error starting StackPulse server:', err);
    process.exit(1);
  }
}

startServer();
