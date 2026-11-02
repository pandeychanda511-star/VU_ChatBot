import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import chatRouter from './routes/chat.js';
import documentsRouter from './routes/documents.js';
import knowledgeRouter from './routes/knowledge.js';
import sourcesRouter from './routes/sources.js';
import studentsRouter from './routes/students.js';
import agenticRouter from './routes/agentic.js';
import evaluationRouter from './routes/evaluation.js';
import securityRouter from './routes/security.js';
import multimodalRouter from './routes/multimodal.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security & Parsing Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production' || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for initial deploy
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Route registrations
app.use('/api', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/agentic', agenticRouter);
app.use('/api/evaluation', evaluationRouter);
app.use('/api/security', securityRouter);
app.use('/api/multimodal', multimodalRouter);
app.use('/api/auth', authRouter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Vidyashilp University Academic Advisor API',
    status: 'online',
    phase: 5,
    endpoints: [
      'GET /api/health',
      'POST /api/chat/message',
      'GET /api/documents/status',
      'POST /api/documents/process',
      'POST /api/knowledge/search',
      'GET /api/sources/pdf/:sourceId',
      'GET /api/sources/excel/:sourceId'
    ]
  });
});

// Centralized 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler (prevent leaking internal details)
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({
    error: 'An unexpected internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Vidyashilp Academic Advisor backend running on http://localhost:${PORT}`);
});
