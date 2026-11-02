import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const XLSX = xlsx.default || xlsx;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workbookPath = path.resolve(__dirname, '../../data/sources/Semester_Spread_Structures_Sept_2026.xlsx');
let curriculumCache = null;

const COHORT_SHEET_MAP = {
  '2024': 'Sem_Spread_2024',
  '2024 Batch': 'Sem_Spread_2024',
  '2023': 'Sem_Spread_2023',
  '2023 Batch': 'Sem_Spread_2023',
  '2022': 'Sem Spread BTECH-2022',
  '2022 Batch': 'Sem Spread BTECH-2022',
  '2025': 'Sem_Spread_2025',
  '2025 Batch': 'Sem_Spread_2025',
  '2026': 'Sem_Spread_DS_2026',
  '2026 Data Science': 'Sem_Spread_DS_2026'
};

/**
 * Extracts and parses full 8-semester curriculum from the official XLSX sheet.
 */
function parseCurriculumFromSheet(wb, sheetName, cohortName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return null;
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!raw || raw.length < 2) return null;

  // Identify column indices for S1 to S8 by scanning Row 0 and Row 1
  const semCols = {};
  for (let r = 0; r <= 1; r++) {
    if (!raw[r]) continue;
    raw[r].forEach((val, c) => {
      const match = String(val || '').trim().match(/^S([1-8])$/i);
      if (match) {
        const sNum = parseInt(match[1], 10);
        if (!semCols[sNum]) {
          semCols[sNum] = c;
        }
      }
    });
  }

  // Fallback defaults if row 0 lacked some
  const defaultCols = { 1: 5, 2: 12, 3: 20, 4: 27, 5: 35, 6: 42, 7: 50, 8: 57 };
  for (let s = 1; s <= 8; s++) {
    if (!semCols[s]) semCols[s] = defaultCols[s];
  }

  const semesters = {};
  for (let s = 1; s <= 8; s++) {
    semesters[s] = [];
    const courseNameCol = semCols[s];
    const courseCodeCol = courseNameCol - 1;
    const prereqCol = courseNameCol + 1;
    const creditCol = courseNameCol + 5;

    for (let r = 2; r < raw.length; r++) {
      const row = raw[r];
      if (!row) continue;
      const code = row[courseCodeCol];
      const name = row[courseNameCol];
      const prereq = row[prereqCol];
      const cred = row[creditCol];

      if (code && typeof code === 'string' && code.trim()) {
        const cleanCode = code.trim();
        const lower = cleanCode.toLowerCase();
        if (lower.includes('total') || lower.includes('basket') || lower === 'c' || lower === 'code') {
          continue;
        }

        const cleanName = name ? String(name).trim() : cleanCode;
        const cleanPrereq = prereq ? String(prereq).trim() : 'NIL';
        const cleanCredits = Number(cred) || 0;

        if (!semesters[s].some(c => c.courseCode === cleanCode)) {
          semesters[s].push({
            courseCode: cleanCode,
            courseName: cleanName,
            prerequisite: cleanPrereq,
            credits: cleanCredits
          });
        }
      }
    }
  }

  return {
    cohort: cohortName,
    sheetName,
    semesters
  };
}

/**
 * Loads and caches all official curriculum cohorts.
 */
export function getCurricula() {
  if (curriculumCache) return curriculumCache;

  if (!fs.existsSync(workbookPath)) {
    console.error('Curriculum workbook not found at:', workbookPath);
    return {};
  }

  try {
    const wb = XLSX.readFile(workbookPath);
    const result = {};

    Object.entries(COHORT_SHEET_MAP).forEach(([cohortKey, sheetName]) => {
      if (!result[cohortKey]) {
        const data = parseCurriculumFromSheet(wb, sheetName, cohortKey);
        if (data) {
          result[cohortKey] = data;
        }
      }
    });

    curriculumCache = result;
    return result;
  } catch (err) {
    console.error('Error parsing curriculum workbook:', err.message);
    return {};
  }
}

/**
 * Resolves curriculum for a given student cohort or defaults to 2024.
 */
export function getCurriculumForCohort(cohort) {
  const curricula = getCurricula();
  if (cohort && curricula[cohort]) {
    return curricula[cohort];
  }

  const cleanCohort = String(cohort || '').replace(/[^0-9]/g, '');
  if (cleanCohort && curricula[cleanCohort]) {
    return curricula[cleanCohort];
  }

  return curricula['2024'] || Object.values(curricula)[0] || { semesters: {} };
}
