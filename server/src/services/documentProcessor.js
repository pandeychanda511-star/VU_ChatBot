import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractPdf } from './pdfExtractor.js';
import { extractExcel } from './excelExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authoritative allowlist of four university files
export const AUTHORIZED_SOURCES = [
  { fileName: '4. Student Handbook Aug 2026.pdf', type: 'pdf' },
  { fileName: 'SOP STUDENT 17082026 - Final.pdf', type: 'pdf' },
  { fileName: 'Minor_Courses_for_BTech_Students.xlsx', type: 'excel' },
  { fileName: 'Semester_Spread_Structures_Sept_2026.xlsx', type: 'excel' }
];

export const SOURCES_DIR = path.resolve(__dirname, '../../data/sources');
export const PROCESSED_DIR = path.resolve(__dirname, '../../data/processed');
export const REPORT_PATH = path.resolve(PROCESSED_DIR, 'processing_report.json');

/**
 * Runs the complete document extraction pipeline.
 * Validates files against allowlist, processes them reproducibly,
 * outputs structured JSON records per document, and writes a processing report.
 */
export async function runDocumentProcessingPipeline() {
  if (!fs.existsSync(SOURCES_DIR)) {
    fs.mkdirSync(SOURCES_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }

  const report = {
    pipelineVersion: '1.0.0',
    executedAt: new Date().toISOString(),
    status: 'in_progress',
    totalSourcesConfigured: AUTHORIZED_SOURCES.length,
    sourcesFound: 0,
    sourcesProcessed: 0,
    sources: [],
    errors: []
  };

  for (const source of AUTHORIZED_SOURCES) {
    const filePath = path.join(SOURCES_DIR, source.fileName);
    const sourceReport = {
      fileName: source.fileName,
      fileType: source.type,
      exists: fs.existsSync(filePath),
      fileSizeBytes: 0,
      status: 'pending',
      summary: {},
      warnings: [],
      error: null
    };

    if (!sourceReport.exists) {
      sourceReport.status = 'missing';
      sourceReport.error = `Authoritative file not found in sources directory: ${source.fileName}`;
      report.sources.push(sourceReport);
      report.errors.push(`Missing: ${source.fileName}`);
      continue;
    }

    report.sourcesFound++;
    const stat = fs.statSync(filePath);
    sourceReport.fileSizeBytes = stat.size;

    try {
      if (source.type === 'pdf') {
        const result = await extractPdf(filePath, source.fileName);
        sourceReport.status = 'success';
        sourceReport.summary = {
          pageCount: result.pageCount,
          extractedPageCount: result.extractedPageCount,
          emptyOrScannedPageCount: result.emptyPages.length,
          emptyPages: result.emptyPages
        };
        if (result.emptyPages.length > 0) {
          sourceReport.warnings.push(
            `Found ${result.emptyPages.length} scanned, blank, or low-text pages (pages: ${result.emptyPages.join(', ')}). OCR not active.`
          );
        }

        // Save structured records reproducibly (overwriting prior run)
        const safeOutName = source.fileName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
        const outFilePath = path.join(PROCESSED_DIR, safeOutName);
        fs.writeFileSync(outFilePath, JSON.stringify(result, null, 2), 'utf-8');
        sourceReport.outputFile = safeOutName;
        report.sourcesProcessed++;
      } else if (source.type === 'excel') {
        const result = await extractExcel(filePath, source.fileName);
        sourceReport.status = 'success';
        sourceReport.summary = {
          sheetCount: result.sheetNames.length,
          sheetNames: result.sheetNames,
          totalRecords: result.totalRecords,
          perSheetBreakdown: result.sheets.map(s => ({
            sheetName: s.sheetName,
            records: s.recordCount,
            emptyRows: s.emptyRows
          }))
        };

        const safeOutName = source.fileName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
        const outFilePath = path.join(PROCESSED_DIR, safeOutName);
        fs.writeFileSync(outFilePath, JSON.stringify(result, null, 2), 'utf-8');
        sourceReport.outputFile = safeOutName;
        report.sourcesProcessed++;
      }
    } catch (err) {
      sourceReport.status = 'failed';
      sourceReport.error = err.message;
      report.errors.push(`Error processing ${source.fileName}: ${err.message}`);
    }

    report.sources.push(sourceReport);
  }

  report.status = (report.sourcesProcessed === AUTHORIZED_SOURCES.length)
    ? 'completed_all_success'
    : (report.sourcesProcessed > 0 ? 'completed_with_issues' : 'failed');

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  return report;
}

/**
 * Returns current processing report or status if not processed.
 */
export function getProcessingStatus() {
  if (!fs.existsSync(REPORT_PATH)) {
    return {
      status: 'not_processed',
      message: 'Document processing pipeline has not been executed yet.',
      authorizedSources: AUTHORIZED_SOURCES.map(s => s.fileName)
    };
  }
  try {
    const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
    const data = JSON.parse(raw);
    // Return clean metadata summary without heavy document data
    return {
      status: data.status,
      executedAt: data.executedAt,
      sourcesProcessed: data.sourcesProcessed,
      totalSourcesConfigured: data.totalSourcesConfigured,
      sources: data.sources.map(s => ({
        fileName: s.fileName,
        fileType: s.fileType,
        status: s.status,
        fileSizeBytes: s.fileSizeBytes,
        summary: s.summary,
        warnings: s.warnings,
        error: s.error
      }))
    };
  } catch (err) {
    return {
      status: 'error_reading_report',
      error: err.message
    };
  }
}

