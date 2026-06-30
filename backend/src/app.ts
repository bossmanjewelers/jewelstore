import 'dotenv/config';
import 'express-async-errors'; // catch async route errors in Express 4
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';

const app = express();

// ─── Security ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      config.frontend.url,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5488',
    ];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    // In production allow same-origin requests
    if (config.env === 'production') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Middleware ────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
if (config.env !== 'production') {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// ─── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api', routes);

// ─── Serve built React frontend ────────────────────────────
// Looks for frontend/dist relative to this file's compiled location
const possibleFrontendPaths = [
  path.join(__dirname, '../../frontend/dist'),      // dev: backend/src → root/frontend/dist
  path.join(__dirname, '../../../frontend/dist'),   // compiled: backend/dist/src → root/frontend/dist
  path.join(process.cwd(), 'frontend/dist'),        // Railway: cwd is project root
];

const frontendDist = possibleFrontendPaths.find(p => fs.existsSync(p));

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  logger.info(`Serving frontend from: ${frontendDist}`);
} else {
  logger.warn('Frontend dist not found — API-only mode');
}

// ─── Error Handling ────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────
export async function startServer(port?: number): Promise<number> {
  const serverPort = port || config.port;
  await prisma.$connect();
  return new Promise((resolve, reject) => {
    const server = app.listen(serverPort, '0.0.0.0', () => {
      logger.info(`🚀 JewelStore running on port ${serverPort} [${config.env}]`);
      resolve(serverPort);
    });
    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start:', err);
    process.exit(1);
  });
}


// Prevent unhandled async rejections from crashing the process (Express 4 limitation)
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled promise rejection (non-fatal):', reason?.message || reason);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
