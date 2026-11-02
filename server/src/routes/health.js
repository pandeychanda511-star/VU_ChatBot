import express from 'express';

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Vidyashilp University Academic Advisor Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;

