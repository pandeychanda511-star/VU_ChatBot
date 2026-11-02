import express from 'express';
import { AgenticWorkflowEngine } from '../services/agenticWorkflow.js';
import { SecurityService } from '../services/securityService.js';

const router = express.Router();

/**
 * POST /api/agentic/advise
 * Executes the 5-stage agentic workflow:
 * Regulation Retrieval -> Course Eligibility -> Credit Calculation -> Recommendation -> Verification
 *
 * Request Body:
 * {
 *   message: string,
 *   studentProfileId?: string,
 *   conversationHistory?: Array
 * }
 */
router.post('/advise', async (req, res) => {
  const { message, studentProfileId, conversationHistory } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
  }

  const trimmed = message.trim();

  // Security Check 1: Prompt Injection Guard
  const injectionCheck = SecurityService.detectPromptInjection(trimmed);
  if (injectionCheck.isInjection) {
    SecurityService.logSecurityEvent({
      eventType: 'INJECTION_ATTEMPT',
      query: trimmed,
      status: 'BLOCKED',
      details: { matchedPattern: injectionCheck.matchedPattern }
    });

    return res.status(200).json({
      reply: '🛡️ **Security Alert**: Your query contains instructions that attempt to override university advising guardrails. In compliance with Phase 10 Academic Privacy & Security standards, this operation was halted.',
      citations: [],
      status: 'blocked',
      agentTrace: [
        {
          agentName: 'Security & Privacy Guardrail Agent',
          step: 0,
          status: 'blocked',
          durationMs: 1,
          summary: `Prompt injection attack blocked: ${injectionCheck.matchedPattern}`
        }
      ]
    });
  }

  // Security Check 2: PII Sanitization
  const piiCheck = SecurityService.inspectAndSanitizePII(trimmed);
  if (piiCheck.piiDetected) {
    SecurityService.logSecurityEvent({
      eventType: 'PII_DETECTED',
      query: trimmed,
      sanitizedQuery: piiCheck.sanitizedText,
      status: 'SANITIZED',
      details: { types: piiCheck.types }
    });
  }

  try {
    const result = await AgenticWorkflowEngine.run({
      userQuery: piiCheck.sanitizedText,
      studentProfileId: studentProfileId || null,
      conversationHistory: conversationHistory || []
    });

    res.status(200).json({
      ...result,
      piiSanitized: piiCheck.piiDetected,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Agentic API] Execution error:', err);
    res.status(500).json({
      error: 'An error occurred during agentic workflow execution: ' + err.message,
      status: 'error'
    });
  }
});

export default router;

