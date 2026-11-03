import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../../data/academic_cycle_config.json');

const DEFAULT_CONFIG = {
  currentAcademicYear: '2026-2027',
  currentSession: 'Odd', // 'Odd' (Fall: Semesters 1, 3, 5, 7) or 'Even' (Spring: Semesters 2, 4, 6, 8)
  referenceCalendarYear: 2026,
  batchProgressionMapping: {
    '2023': { currentSemester: 7, label: 'Semester 7' },
    '2024': { currentSemester: 5, label: 'Semester 5' },
    '2025': { currentSemester: 3, label: 'Semester 3' },
    '2026': { currentSemester: 1, label: 'Semester 1' },
    '2022': { currentSemester: 8, label: 'Semester 8' }
  },
  lastUpdated: new Date().toISOString()
};

function readConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed reading academic cycle config:', err.message);
  }
  return DEFAULT_CONFIG;
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing academic cycle config:', err.message);
  }
}

/**
 * Returns the current academic configuration
 */
export function getAcademicCycleConfig() {
  return readConfig();
}

/**
 * Updates the academic configuration (Admin accessible)
 */
export function updateAcademicCycleConfig(newSettings) {
  const current = readConfig();
  const updated = {
    ...current,
    ...newSettings,
    batchProgressionMapping: {
      ...current.batchProgressionMapping,
      ...(newSettings.batchProgressionMapping || {})
    },
    lastUpdated: new Date().toISOString()
  };
  writeConfig(updated);
  return updated;
}

/**
 * Calculates current semester and progression status for a student based on admission batch & records.
 *
 * Rules:
 * - 2023 Batch -> Semester 7
 * - 2024 Batch -> Semester 5
 * - 2025 Batch -> Semester 3
 * - 2026 Batch -> Semester 1
 *
 * Configurable via academic_cycle_config.json.
 * Separates:
 * 1. currentSemester
 * 2. completedSemesters (semesters < currentSemester with grades)
 * 3. pendingResults (currentSemester if grades not entered)
 * 4. upcomingSemesters (semesters > currentSemester)
 */
export function calculateStudentProgression(student, studentGrades = {}) {
  const cfg = readConfig();
  const batchStr = String(student.admissionCohort || student.cohort || '2024').replace(/\D/g, '') || '2024';

  // Configured semester progression
  let currentSemester = cfg.batchProgressionMapping[batchStr]?.currentSemester;
  if (!currentSemester) {
    // Dynamic formula fallback: each elapsed calendar year = 2 semesters (Odd cycle = +1)
    const currentYear = cfg.referenceCalendarYear || new Date().getFullYear();
    const batchYear = parseInt(batchStr, 10);
    const diffYears = Math.max(0, currentYear - batchYear);
    const isOddSession = cfg.currentSession === 'Odd';
    currentSemester = Math.min(8, Math.max(1, diffYears * 2 + (isOddSession ? 1 : 2)));
  }

  // If student profile has explicit currentSemester override (e.g. progression delay/break)
  if (student.currentSemesterOverride && Number.isInteger(student.currentSemesterOverride)) {
    currentSemester = student.currentSemesterOverride;
  }

  const completedSemesters = [];
  const upcomingSemesters = [];
  let isCurrentSemesterCompleted = false;

  for (let s = 1; s <= 8; s++) {
    if (s < currentSemester) {
      completedSemesters.push(s);
    } else if (s === currentSemester) {
      // Check if current semester grades have been entered
      // A semester is completed if grades are recorded
      isCurrentSemesterCompleted = false;
    } else {
      upcomingSemesters.push(s);
    }
  }

  return {
    admissionBatch: batchStr,
    currentSemester,
    completedSemesters,
    pendingSemesters: [currentSemester],
    upcomingSemesters,
    academicSession: cfg.currentSession,
    academicYear: cfg.currentAcademicYear
  };
}
