import express from 'express';
import { SecurityService } from '../services/securityService.js';

const router = express.Router();

/**
 * GET /api/security/audit-log
 * Returns recent security audit events.
 */
router.get('/audit-log', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  const logs = SecurityService.getAuditLogs(limit);
  res.status(200).json({
    total: logs.length,
    logs
  });
});

/**
 * POST /api/security/test
 * Runs the automated Phase 10 security audit suite against prompt injection, PII, and unauthorized access.
 */
router.post('/test', (req, res) => {
  const results = SecurityService.runSecurityAuditSuite();
  const passedCount = results.filter(r => r.passed).length;

  res.status(200).json({
    totalTests: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    passRatePercentage: Math.round((passedCount / results.length) * 100),
    timestamp: new Date().toISOString(),
    results
  });
});

/**
 * POST /api/security/sanitize
 * Test endpoint to sanitize an arbitrary text input.
 */
router.post('/sanitize', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text field is required' });
  }

  const piiResult = SecurityService.inspectAndSanitizePII(text);
  const injectionResult = SecurityService.detectPromptInjection(text);

  res.status(200).json({
    originalText: text,
    sanitizedText: piiResult.sanitizedText,
    piiDetected: piiResult.piiDetected,
    piiTypes: piiResult.types,
    isPromptInjection: injectionResult.isInjection,
    injectionPattern: injectionResult.matchedPattern
  });
});

export default router;

