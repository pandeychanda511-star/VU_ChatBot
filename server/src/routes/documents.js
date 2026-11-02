import express from 'express';
import { getProcessingStatus, runDocumentProcessingPipeline } from '../services/documentProcessor.js';

const router = express.Router();

/**
 * GET /api/documents/status
 * Returns document processing metadata only.
 * Does not expose raw file contents or sensitive server paths.
 */
router.get('/status', (req, res) => {
  try {
    const status = getProcessingStatus();
    res.status(200).json(status);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve document status',
      details: err.message
    });
  }
});

/**
 * POST /api/documents/process
 * Triggers the reproducible document extraction pipeline.
 */
router.post('/process', async (req, res) => {
  try {
    const report = await runDocumentProcessingPipeline();
    res.status(200).json({
      status: report.status,
      executedAt: report.executedAt,
      sourcesProcessed: report.sourcesProcessed,
      sources: report.sources.map(s => ({
        fileName: s.fileName,
        fileType: s.fileType,
        status: s.status,
        summary: s.summary,
        warnings: s.warnings,
        error: s.error
      }))
    });
  } catch (err) {
    res.status(500).json({
      error: 'Document processing pipeline encountered an error',
      details: err.message
    });
  }
});

export default router;

