import express from 'express';
import { CURRICULUM_FLOWCHART, AUDIO_REGULATIONS } from '../services/multimodalService.js';
import { generateSemesterCoursesSvg } from '../services/imageCardGenerator.js';
import { getKnowledgeBase } from '../services/knowledgePreparation.js';

const router = express.Router();

/**
 * GET /api/multimodal/course-flow
 * Returns the interactive curriculum prerequisite flowchart graph for B.Tech CSE.
 */
router.get('/course-flow', (req, res) => {
  res.status(200).json(CURRICULUM_FLOWCHART);
});

/**
 * GET /api/multimodal/audio-regulations
 * Returns the catalog of audio regulation briefings with text scripts and audio player metadata.
 */
router.get('/audio-regulations', (req, res) => {
  res.status(200).json({
    total: AUDIO_REGULATIONS.length,
    regulations: AUDIO_REGULATIONS
  });
});

/**
 * GET /api/multimodal/audio-regulations/:id
 * Returns a specific audio regulation briefing by ID.
 */
router.get('/audio-regulations/:id', (req, res) => {
  const item = AUDIO_REGULATIONS.find(a => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: `Audio regulation '${req.params.id}' not found.` });
  }
  res.status(200).json(item);
});

/**
 * GET /api/multimodal/semester-card-image
 * Returns an image (SVG) listing courses for a specified semester and batch.
 */
router.get('/semester-card-image', async (req, res) => {
  const semNum = parseInt(req.query.semester || '1', 10);
  const batch = req.query.batch || '2023 Batch';

  try {
    const kb = await getKnowledgeBase();
    // Find semester overview record
    const target = kb.records.find(r => 
      r.metadata?.isSemesterOverview && 
      r.metadata?.semesterNumber === semNum &&
      (batch ? r.sheetName.includes(batch.replace(' Batch', '')) : true)
    ) || kb.records.find(r => r.metadata?.isSemesterOverview && r.metadata?.semesterNumber === semNum);

    let courses = [];
    if (target && target.text) {
      // Parse course lines
      const lines = target.text.split('\n');
      for (const line of lines) {
        const m = line.match(/^\d+\.\s*\[([^\]]+)\]\s*([^–-]+)\s*[-–]\s*(\d+)\s*Credits?(?:\s*\((.*)\))?/i);
        if (m) {
          const catMatch = (m[4] || '').match(/Category:\s*([^,)]+)/i);
          const preMatch = (m[4] || '').match(/Prerequisite:\s*([^,)]+)/i);
          courses.push({
            code: m[1].trim(),
            name: m[2].trim(),
            credits: parseInt(m[3], 10),
            category: catMatch ? catMatch[1].trim() : 'Core',
            prerequisite: preMatch ? preMatch[1].trim() : 'Nil'
          });
        }
      }
    }

    if (courses.length === 0) {
      // Fallback from CURRICULUM_FLOWCHART
      const fallbackSem = CURRICULUM_FLOWCHART.semesters.find(s => s.semester === semNum);
      if (fallbackSem) {
        courses = fallbackSem.courses.map(c => ({
          code: c.code,
          name: c.name,
          credits: c.credits,
          category: c.type || 'Core',
          prerequisite: c.prerequisites?.join(', ') || 'Nil'
        }));
      }
    }

    const svg = generateSemesterCoursesSvg(batch, semNum, courses);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (err) {
    console.error('Error generating semester image:', err);
    res.status(500).json({ error: 'Failed to generate semester image' });
  }
});

export default router;

