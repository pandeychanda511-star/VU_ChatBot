import express from 'express';
import { getRetrievalEngine } from '../services/retrievalEngine.js';

const router = express.Router();

/**
 * POST /api/knowledge/search
 * Validated search endpoint over the 4 authoritative university knowledge files.
 *
 * Body:
 * {
 *   query: string (required, 1..500 chars),
 *   limit?: number (optional, 1..20, default 5),
 *   threshold?: number (optional)
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit, threshold } = req.body;

    // 1. Validate query presence and type
    if (query === undefined || query === null || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: "query" field is required and must be a string.'
      });
    }

    const trimmed = query.trim();

    // 2. Reject empty query
    if (trimmed.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "query" cannot be empty or whitespace only.'
      });
    }

    // 3. Reject excessively long queries (prevent abuse/DDoS)
    if (trimmed.length > 500) {
      return res.status(400).json({
        error: 'Invalid request: "query" is too long (maximum 500 characters).'
      });
    }

    // 4. Validate limit if provided
    let parsedLimit = 5;
    if (limit !== undefined) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
        return res.status(400).json({
          error: 'Invalid request: "limit" must be an integer between 1 and 20.'
        });
      }
    }

    // 5. Validate threshold if provided
    let parsedThreshold = undefined;
    if (threshold !== undefined) {
      parsedThreshold = parseFloat(threshold);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          error: 'Invalid request: "threshold" must be a positive number.'
        });
      }
    }

    // 6. Execute retrieval
    const engine = await getRetrievalEngine();
    const searchResults = await engine.search(trimmed, {
      limit: parsedLimit,
      threshold: parsedThreshold
    });

    res.status(200).json(searchResults);
  } catch (err) {
    console.error('[Retrieval API Error]', err.message);
    res.status(500).json({
      error: 'An internal error occurred while processing knowledge retrieval.'
    });
  }
});

export default router;

