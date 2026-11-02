import express from 'express';
import { EvaluationBenchmarkService } from '../services/evaluationBenchmark.js';

const router = express.Router();

/**
 * GET /api/evaluation/testset
 * Returns the verified 25 academic test cases.
 */
router.get('/testset', (req, res) => {
  const testset = EvaluationBenchmarkService.loadTestSet();
  res.status(200).json({
    total: testset.length,
    testCases: testset
  });
});

/**
 * GET /api/evaluation/results
 * Returns the cached or computed benchmark evaluation results across all 5 stages.
 */
router.get('/results', async (req, res) => {
  try {
    const results = await EvaluationBenchmarkService.getBenchmarkResults();
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve benchmark results: ' + err.message });
  }
});

/**
 * POST /api/evaluation/run
 * Forces a re-run of the comprehensive 25-case evaluation benchmark.
 */
router.post('/run', async (req, res) => {
  try {
    const results = await EvaluationBenchmarkService.runFullBenchmark();
    res.status(200).json({
      message: 'Evaluation benchmark completed successfully.',
      ...results
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run evaluation benchmark: ' + err.message });
  }
});

export default router;

