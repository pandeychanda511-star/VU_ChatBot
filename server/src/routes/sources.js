import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AUTHORIZED_SOURCES, SOURCES_DIR, PROCESSED_DIR } from '../services/documentProcessor.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowlisted file mapping with clean IDs to prevent server path leakage
const SOURCE_MAP = {
  'handbook': {
    fileName: '4. Student Handbook Aug 2026.pdf',
    type: 'pdf',
    filePath: path.join(SOURCES_DIR, '4. Student Handbook Aug 2026.pdf'),
    jsonFile: path.join(PROCESSED_DIR, '4__Student_Handbook_Aug_2026_pdf.json')
  },
  'sop': {
    fileName: 'SOP STUDENT 17082026 - Final.pdf',
    type: 'pdf',
    filePath: path.join(SOURCES_DIR, 'SOP STUDENT 17082026 - Final.pdf'),
    jsonFile: path.join(PROCESSED_DIR, 'SOP_STUDENT_17082026_-_Final_pdf.json')
  },
  'minors': {
    fileName: 'Minor_Courses_for_BTech_Students.xlsx',
    type: 'excel',
    filePath: path.join(SOURCES_DIR, 'Minor_Courses_for_BTech_Students.xlsx'),
    jsonFile: path.join(PROCESSED_DIR, 'Minor_Courses_for_BTech_Students_xlsx.json')
  },
  'semester_spread': {
    fileName: 'Semester_Spread_Structures_Sept_2026.xlsx',
    type: 'excel',
    filePath: path.join(SOURCES_DIR, 'Semester_Spread_Structures_Sept_2026.xlsx'),
    jsonFile: path.join(PROCESSED_DIR, 'Semester_Spread_Structures_Sept_2026_xlsx.json')
  }
};

/**
 * Resolves a source identifier or filename to an allowlisted source config.
 */
function resolveSource(identifier) {
  if (!identifier) return null;
  const lower = identifier.toLowerCase().trim();
  if (SOURCE_MAP[lower]) return SOURCE_MAP[lower];

  for (const [key, config] of Object.entries(SOURCE_MAP)) {
    if (config.fileName.toLowerCase() === lower || key === lower) {
      return config;
    }
  }
  return null;
}

/**
 * GET /api/sources/pdf/:sourceId
 * Serves an authorized PDF document with headers permitting page navigation (e.g. #page=29).
 * Query param: ?page=29
 */
router.get('/pdf/:sourceId', (req, res) => {
  const { sourceId } = req.params;
  const { page } = req.query;

  const sourceConfig = resolveSource(sourceId);
  if (!sourceConfig || sourceConfig.type !== 'pdf') {
    return res.status(404).json({ error: 'Authorized PDF source not found' });
  }

  if (!fs.existsSync(sourceConfig.filePath)) {
    return res.status(404).json({ error: 'Source document file is missing from data store' });
  }

  // Validate optional page query parameter
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Page parameter must be a positive integer' });
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(sourceConfig.fileName)}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const fileStream = fs.createReadStream(sourceConfig.filePath);
  fileStream.pipe(res);
});

/**
 * GET /api/sources/excel/:sourceId
 * Returns structured metadata and rows for a cited Excel sheet.
 * Query params: ?sheet=Law%20Minor&row=3
 */
router.get('/excel/:sourceId', (req, res) => {
  const { sourceId } = req.params;
  const { sheet, row } = req.query;

  const sourceConfig = resolveSource(sourceId);
  if (!sourceConfig || sourceConfig.type !== 'excel') {
    return res.status(404).json({ error: 'Authorized Excel source not found' });
  }

  if (!fs.existsSync(sourceConfig.jsonFile)) {
    return res.status(404).json({ error: 'Processed data for source is missing' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(sourceConfig.jsonFile, 'utf-8'));
    
    // If specific sheet is requested
    if (sheet) {
      const targetSheet = data.sheets.find(s => s.sheetName.toLowerCase() === sheet.toLowerCase().trim());
      if (!targetSheet) {
        return res.status(404).json({
          error: `Worksheet "${sheet}" not found in workbook.`,
          availableSheets: data.sheetNames
        });
      }

      // If specific row is requested
      if (row) {
        const rowNum = parseInt(row, 10);
        if (isNaN(rowNum) || rowNum < 1) {
          return res.status(400).json({ error: 'Row number must be a positive integer.' });
        }
        const record = targetSheet.records.find(r => r.rowNumber === rowNum);
        return res.status(200).json({
          sourceType: 'excel',
          fileName: sourceConfig.fileName,
          sheetName: targetSheet.sheetName,
          rowNumber: rowNum,
          headers: targetSheet.headers,
          record: record || null,
          found: !!record
        });
      }

      // Return sheet summary with bounded sample rows
      return res.status(200).json({
        sourceType: 'excel',
        fileName: sourceConfig.fileName,
        sheetName: targetSheet.sheetName,
        totalRows: targetSheet.totalRows,
        recordCount: targetSheet.recordCount,
        headers: targetSheet.headers,
        records: targetSheet.records.slice(0, 50) // bounded payload
      });
    }

    // Default workbook info
    res.status(200).json({
      sourceType: 'excel',
      fileName: sourceConfig.fileName,
      sheetNames: data.sheetNames,
      totalRecords: data.totalRecords
    });
  } catch (err) {
    console.error('[Sources API] Error reading excel record:', err.message);
    res.status(500).json({ error: 'Failed to read Excel source data' });
  }
});

export default router;

