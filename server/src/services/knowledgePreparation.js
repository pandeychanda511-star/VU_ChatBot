import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROCESSED_DIR = path.resolve(__dirname, '../../data/processed');
export const SOURCES_DIR = path.resolve(__dirname, '../../data/sources');
export const KNOWLEDGE_BASE_PATH = path.resolve(PROCESSED_DIR, 'knowledge_base.json');

/**
 * Splits long text into sensible overlapping chunks respecting paragraph or line boundaries.
 *
 * @param {string} text - The input text to chunk
 * @param {number} maxChars - Maximum characters per chunk (default 1200)
 * @param {number} overlapChars - Overlap between consecutive chunks (default 200)
 * @returns {string[]} Array of chunked text strings
 */
export function chunkText(text, maxChars = 1200, overlapChars = 200) {
  if (!text || text.trim().length === 0) return [];
  if (text.length <= maxChars) return [text.trim()];

  const paragraphs = text.split(/\n\s*\n|\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((currentChunk + '\n' + trimmed).length <= maxChars) {
      currentChunk = currentChunk ? (currentChunk + '\n' + trimmed) : trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Calculate overlapping text from end of currentChunk
        const overlapStart = Math.max(0, currentChunk.length - overlapChars);
        const overlapText = currentChunk.slice(overlapStart).trim();
        currentChunk = overlapText ? (overlapText + '\n' + trimmed) : trimmed;
      } else {
        // Single paragraph larger than maxChars: split by sentences or hard boundary
        let start = 0;
        while (start < trimmed.length) {
          const end = Math.min(start + maxChars, trimmed.length);
          chunks.push(trimmed.slice(start, end).trim());
          start += (maxChars - overlapChars);
        }
        currentChunk = '';
      }
    }
  }

  if (currentChunk && currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Extracts complete, exhaustive semester course offerings from Semester_Spread_Structures_Sept_2026.xlsx.
 * Groups by batch and semester (Semester 1 to Semester 8), ensuring no courses are missed.
 */
function extractSemesterSpreadAggregations(xlsxFilePath, originalFileName) {
  if (!fs.existsSync(xlsxFilePath)) return [];
  const wb = XLSX.readFile(xlsxFilePath);
  const semSpreadSheets = [
    { sheetName: 'Sem Spread BTECH-2022', batch: '2022 Batch' },
    { sheetName: 'Sem_Spread_2023', batch: '2023 Batch' },
    { sheetName: 'Sem_Spread_2024', batch: '2024 Batch' },
    { sheetName: 'Sem_Spread_2025', batch: '2025 Batch' },
    { sheetName: 'Sem_Spread_DS_2026', batch: '2026 Batch (Data Science)' }
  ];

  const aggregatedRecords = [];

  for (const item of semSpreadSheets) {
    const worksheet = wb.Sheets[item.sheetName];
    if (!worksheet) continue;
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!data || data.length < 3) continue;

    const row0 = data[0];
    const semCols = [];
    for (let c = 0; c < row0.length; c++) {
      const val = String(row0[c] || '').trim();
      if (/^S[1-8]$/i.test(val)) {
        semCols.push({ sem: val.toUpperCase(), semNum: parseInt(val.slice(1)), col: c });
      }
    }

    semCols.forEach(sc => {
      let currentBasket = '';
      const courses = [];
      const maxRow = Math.min(data.length, 35);

      for (let r = 2; r < maxRow; r++) {
        const row = data[r];
        if (!row) continue;
        if (row[1] && String(row[1]).trim()) currentBasket = String(row[1]).trim();

        const nameCol = sc.col;
        const codeCol = sc.col - 1;
        const prereqCol = sc.col + 1;
        const credCol = sc.col + 5;

        const code = (row[codeCol] ? String(row[codeCol]).trim() : '');
        const name = (row[nameCol] ? String(row[nameCol]).trim() : '');
        const prereq = (row[prereqCol] ? String(row[prereqCol]).trim() : 'NIL');
        const credits = (row[credCol] !== undefined && row[credCol] !== null && String(row[credCol]).trim() !== '') ? row[credCol] : '';

        if (code.includes('Total') || name.includes('Total') || name.startsWith('SEMESTER') || code.includes('HRS')) continue;

        if (name && name.length > 1 && !name.startsWith('SEMESTER')) {
          courses.push({
            code: code || 'N/A',
            name: name.replace(/\r?\n/g, ' '),
            credits,
            prereq: prereq || 'NIL',
            basket: currentBasket || 'Core'
          });
        }
      }

      if (courses.length > 0) {
        const totalCredits = courses.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0);
        const courseLines = courses.map((c, idx) => 
          `${idx + 1}. ${c.code !== 'N/A' ? `[${c.code}] ` : ''}${c.name} - ${c.credits} Credits (Category: ${c.basket}, Prerequisite: ${c.prereq})`
        ).join('\n');

        const fullText = `Sheet: ${item.sheetName} | Batch: ${item.batch} | Degree: B.Tech Computer Science and Engineering | Semester: Semester ${sc.semNum} (S${sc.semNum}) | Total Courses: ${courses.length} | Total Credits: ${totalCredits}\n` +
          `Complete, exhaustive list of all ${courses.length} courses offered in ${item.batch} B.Tech Semester ${sc.semNum} (Total Credits: ${totalCredits}):\n` + courseLines;

        aggregatedRecords.push({
          id: `${originalFileName}::${item.sheetName}::Semester_${sc.semNum}`,
          sourceType: 'excel',
          fileName: originalFileName,
          sheetName: item.sheetName,
          semesterNumber: sc.semNum,
          batchYear: item.batch,
          totalCourses: courses.length,
          totalCredits,
          courses,
          text: fullText,
          rawText: fullText,
          charCount: fullText.length,
          metadata: {
            sheetName: item.sheetName,
            semesterNumber: sc.semNum,
            batchYear: item.batch,
            isSemesterOverview: true
          }
        });
      }
    });
  }

  return aggregatedRecords;
}

/**
 * Extracts complete minor track course overviews from Minor_Courses_for_BTech_Students.xlsx.
 */
function extractMinorTrackAggregations(xlsxFilePath, originalFileName) {
  if (!fs.existsSync(xlsxFilePath)) return [];
  const wb = XLSX.readFile(xlsxFilePath);
  const aggregated = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!data || data.length < 2) continue;

    const courses = [];
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;
      const nonEmpties = row.filter(c => c !== undefined && c !== null && String(c).trim() !== '');
      if (nonEmpties.length >= 3) {
        courses.push(nonEmpties.join(' | '));
      }
    }

    if (courses.length > 0) {
      const fullText = `Sheet: ${sheetName} | Minor Program: ${sheetName} for B.Tech Students | Total Courses: ${courses.length}\n` +
        `Complete list of courses for ${sheetName} Minor:\n` +
        courses.map((c, i) => `${i + 1}. ${c}`).join('\n');

      aggregated.push({
        id: `${originalFileName}::${sheetName}::Track_Summary`,
        sourceType: 'excel',
        fileName: originalFileName,
        sheetName: sheetName,
        text: fullText,
        rawText: fullText,
        charCount: fullText.length,
        metadata: {
          sheetName: sheetName,
          isMinorTrackOverview: true
        }
      });
    }
  }

  return aggregated;
}

/**
 * Prepares searchable knowledge records from the Phase 2 extracted JSON files.
 * Preserves all source metadata (file, type, page, sheet, row, headers).
 * Deterministic and reproducible: replacing existing outputs without duplication.
 *
 * @returns {Promise<{
 *   totalRecords: number,
 *   sourceBreakdown: Record<string, number>,
 *   records: Array<any>
 * }>}
 */
export async function prepareKnowledgeBase() {
  if (!fs.existsSync(PROCESSED_DIR)) {
    throw new Error(`Processed directory not found at: ${PROCESSED_DIR}`);
  }

  const processedFiles = [
    { key: 'student_handbook', file: '4__Student_Handbook_Aug_2026_pdf.json', type: 'pdf' },
    { key: 'sop', file: 'SOP_STUDENT_17082026_-_Final_pdf.json', type: 'pdf' },
    { key: 'minors', file: 'Minor_Courses_for_BTech_Students_xlsx.json', type: 'excel' },
    { key: 'sem_spread', file: 'Semester_Spread_Structures_Sept_2026_xlsx.json', type: 'excel' }
  ];

  const preparedRecords = [];
  const sourceBreakdown = {};

  for (const item of processedFiles) {
    const fullPath = path.join(PROCESSED_DIR, item.file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Processed file missing: ${item.file}. Run document processing first.`);
    }

    const raw = fs.readFileSync(fullPath, 'utf-8');
    const docData = JSON.parse(raw);
    const fileName = docData.fileName;
    sourceBreakdown[fileName] = 0;

    if (item.type === 'pdf') {
      // Process PDF pages
      for (const page of docData.pages) {
        if (page.isScannedOrEmpty || !page.text || page.text.trim().length === 0) {
          continue; // Skip empty/scanned separator pages
        }

        const chunks = chunkText(page.text, 1200, 200);
        chunks.forEach((chunkContent, idx) => {
          const recordId = `${fileName}::p${page.pageNumber}::c${idx + 1}`;
          preparedRecords.push({
            id: recordId,
            sourceType: 'pdf',
            fileName: fileName,
            pageNumber: page.pageNumber,
            chunkIndex: idx + 1,
            totalChunksOnPage: chunks.length,
            text: chunkContent,
            charCount: chunkContent.length,
            metadata: {
              pageNumber: page.pageNumber,
              chunkIndex: idx + 1
            }
          });
          sourceBreakdown[fileName]++;
        });
      }
    } else if (item.type === 'excel') {
      // Process Excel sheets and rows
      for (const sheet of docData.sheets) {
        for (const record of sheet.records) {
          if (!record.text || record.text.trim().length === 0) continue;

          const recordId = `${fileName}::${sheet.sheetName}::r${record.rowNumber}`;
          // Contextual text includes sheet name to boost relevant sheet queries (e.g. "Psychology Minor")
          const fullSearchableText = `Sheet: ${sheet.sheetName} | ${record.text}`;

          preparedRecords.push({
            id: recordId,
            sourceType: 'excel',
            fileName: fileName,
            sheetName: sheet.sheetName,
            rowNumber: record.rowNumber,
            cellValues: record.cellValues,
            headers: sheet.headers,
            text: fullSearchableText,
            rawText: record.text,
            charCount: fullSearchableText.length,
            metadata: {
              sheetName: sheet.sheetName,
              rowNumber: record.rowNumber
            }
          });
          sourceBreakdown[fileName]++;
        }
      }
    }
  }

  // Add specialized aggregated records for Semester Spread sheets and Minor sheets
  // so that whole-semester curriculum queries and whole-minor queries retrieve
  // ALL courses in one cohesive record rather than being limited by row-level top-K truncation.
  const semSpreadSrc = path.join(SOURCES_DIR, 'Semester_Spread_Structures_Sept_2026.xlsx');
  const semFileName = 'Semester_Spread_Structures_Sept_2026.xlsx';
  if (fs.existsSync(semSpreadSrc)) {
    const semAggs = extractSemesterSpreadAggregations(semSpreadSrc, semFileName);
    for (const rec of semAggs) {
      preparedRecords.push(rec);
      if (sourceBreakdown[semFileName] !== undefined) {
        sourceBreakdown[semFileName]++;
      }
    }
  }

  const minorsSrc = path.join(SOURCES_DIR, 'Minor_Courses_for_BTech_Students.xlsx');
  const minorsFileName = 'Minor_Courses_for_BTech_Students.xlsx';
  if (fs.existsSync(minorsSrc)) {
    const minorAggs = extractMinorTrackAggregations(minorsSrc, minorsFileName);
    for (const rec of minorAggs) {
      preparedRecords.push(rec);
      if (sourceBreakdown[minorsFileName] !== undefined) {
        sourceBreakdown[minorsFileName]++;
      }
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    totalRecords: preparedRecords.length,
    sourceBreakdown,
    records: preparedRecords
  };

  // Persist deterministically
  fs.writeFileSync(KNOWLEDGE_BASE_PATH, JSON.stringify(result, null, 2), 'utf-8');
  return result;
}

/**
 * Loads knowledge base records from disk, preparing them if not already cached.
 */
export async function getKnowledgeBase() {
  if (fs.existsSync(KNOWLEDGE_BASE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(KNOWLEDGE_BASE_PATH, 'utf-8'));
      if (data && Array.isArray(data.records) && data.records.length > 0) {
        return data;
      }
    } catch {
      // If malformed, regenerate
    }
  }
  return await prepareKnowledgeBase();
}
