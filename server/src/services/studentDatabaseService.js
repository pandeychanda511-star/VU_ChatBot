import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCurriculumForCohort } from './curriculumService.js';
import { calculateStudentProgression } from './academicProgressionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
const studentsDbPath = path.resolve(dataDir, 'students_db.json');
const studentGradesDbPath = path.resolve(dataDir, 'student_grades_db.json');
const registeredUsersPath = path.resolve(dataDir, 'registered_users.json');

// Ensure database files exist
function initDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(studentsDbPath)) {
    fs.writeFileSync(studentsDbPath, JSON.stringify([], null, 2), 'utf8');
  }

  if (!fs.existsSync(studentGradesDbPath)) {
    fs.writeFileSync(studentGradesDbPath, JSON.stringify({}, null, 2), 'utf8');
  }
}

initDb();

function readJson(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return defaultVal;
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

/**
 * Normalizes UUN (e.g., "uun01", "UUN-01", "UUN 1", "VU24BTECH001").
 */
export function normalizeUun(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().toUpperCase().replace(/[\s\-_]/g, '');
  
  // Format "UUN1" -> "UUN01"
  const uunMatch = trimmed.match(/^UUN0*(\d+)$/i);
  if (uunMatch) {
    const num = parseInt(uunMatch[1], 10);
    return `UUN${String(num).padStart(2, '0')}`;
  }

  // Format "VU24BTECH001" -> "UUN01"
  const vuMatch = trimmed.match(/^VU\d*BTECH0*(\d+)$/i);
  if (vuMatch) {
    const num = parseInt(vuMatch[1], 10);
    return `UUN${String(num).padStart(2, '0')}`;
  }

  return trimmed;
}

/**
 * Letter Grade to 10-Point Grade Scale Mapping (10.0 Scale)
 */
export const GRADE_POINT_MAP = {
  'A+': 10.0,
  'A': 9.0,
  'B+': 8.0,
  'B': 7.0,
  'C': 6.0,
  'D': 5.0,
  'E': 4.0,
  'Fail / Backlog': 0.0,
  'F': 0.0,
  'Fail': 0.0
};

export const ALLOWED_GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'Fail / Backlog'];

/**
 * Calculates academic standing, SGPA per semester, CGPA, backlogs, and distinguishes
 * Completed Semesters, Current Semester, and Upcoming Semesters.
 */
export function calculateAcademicStanding(student, allGradesForStudent = {}) {
  const cohort = student.admissionCohort || student.cohort || '2024';
  const curriculum = getCurriculumForCohort(cohort);
  const progression = calculateStudentProgression(student, allGradesForStudent);
  const currentSemester = progression.currentSemester;

  let totalCurriculumCredits = 0;
  let completedCredits = 0;
  let totalQualityPoints = 0;
  let totalGradedCredits = 0;

  const backlogs = [];
  const completedCourses = [];
  const semesterSummaries = [];
  let completedSemestersCount = 0;
  let upcomingSemestersCount = 0;

  for (let s = 1; s <= 8; s++) {
    const courses = curriculum.semesters[s] || [];
    let semEarnedCredits = 0;
    let semGradedCredits = 0;
    let semQualityPoints = 0;
    let semTotalCredits = 0;

    const isUpcoming = s > currentSemester;
    const isCurrent = s === currentSemester;
    const isPast = s < currentSemester;

    if (isUpcoming) {
      upcomingSemestersCount++;
    }

    const courseDetails = courses.map(c => {
      semTotalCredits += c.credits;
      totalCurriculumCredits += c.credits;

      if (isUpcoming) {
        return {
          ...c,
          grade: 'UPCOMING',
          status: 'UPCOMING',
          gradePoints: null
        };
      }

      const assignedGrade = allGradesForStudent[c.courseCode] || allGradesForStudent[c.courseCode.toLowerCase()] || null;
      
      // If current semester and no grade assigned yet, it's in progress / pending
      if (!assignedGrade) {
        return {
          ...c,
          grade: null,
          status: isCurrent ? 'In Progress' : 'Pending',
          gradePoints: null
        };
      }

      const isFail = assignedGrade === 'Fail / Backlog' || assignedGrade === 'F' || assignedGrade === 'Fail';
      const pts = GRADE_POINT_MAP[assignedGrade] !== undefined ? GRADE_POINT_MAP[assignedGrade] : (isFail ? 0.0 : 7.0);

      if (isFail) {
        backlogs.push({
          code: c.courseCode,
          name: c.courseName,
          credits: c.credits,
          semester: s
        });
        return {
          ...c,
          grade: assignedGrade,
          status: 'Backlog',
          gradePoints: pts
        };
      } else {
        semEarnedCredits += c.credits;
        completedCredits += c.credits;
        semGradedCredits += c.credits;
        semQualityPoints += pts * c.credits;

        completedCourses.push({
          code: c.courseCode,
          name: c.courseName,
          credits: c.credits,
          grade: assignedGrade,
          semester: s
        });

        return {
          ...c,
          grade: assignedGrade,
          status: 'Passed',
          gradePoints: pts
        };
      }
    });

    const hasAnyGrade = semGradedCredits > 0 || courseDetails.some(c => c.status === 'Backlog');
    const sgpa = semGradedCredits > 0 ? Number((semQualityPoints / semGradedCredits).toFixed(2)) : null;

    if (hasAnyGrade) {
      totalQualityPoints += semQualityPoints;
      totalGradedCredits += semGradedCredits;
      if (isPast || (isCurrent && hasAnyGrade)) {
        completedSemestersCount++;
      }
    }

    let semStatus = 'UPCOMING';
    if (isUpcoming) {
      semStatus = 'UPCOMING';
    } else if (isCurrent) {
      semStatus = hasAnyGrade ? 'Current (Results Published)' : 'Current (In Progress)';
    } else {
      semStatus = hasAnyGrade ? 'Completed' : 'Pending';
    }

    semesterSummaries.push({
      semester: s,
      isUpcoming,
      isCurrent,
      isCompleted: isPast && hasAnyGrade,
      status: semStatus,
      totalCredits: semTotalCredits,
      earnedCredits: semEarnedCredits,
      sgpa,
      courses: courseDetails
    });
  }

  const cgpa = totalGradedCredits > 0 ? Number((totalQualityPoints / totalGradedCredits).toFixed(2)) : 0.0;
  const remainingCredits = Math.max(0, totalCurriculumCredits - completedCredits);

  return {
    cgpa,
    completedCredits,
    totalCurriculumCredits,
    remainingCredits,
    currentSemester,
    completedSemesters: completedSemestersCount,
    upcomingSemesters: upcomingSemestersCount,
    backlogs,
    completedCourses,
    semesterSummaries,
    progression,
    academicStatus: backlogs.length > 0 ? 'Academic Warning (Backlog)' : 'Good Standing'
  };
}

/**
 * Initializes default passing grades for past completed semesters upon student registration.
 * Semesters < currentSemester get valid grades.
 * Current and Upcoming semesters are NOT graded.
 */
function createDefaultGradesForCohort(cohort) {
  const curriculum = getCurriculumForCohort(cohort);
  const fakeStudent = { admissionCohort: cohort };
  const progression = calculateStudentProgression(fakeStudent);
  const currentSem = progression.currentSemester;

  const grades = {};
  const gradeCycle = ['A+', 'A', 'B+', 'A', 'B+', 'A', 'A+', 'B'];

  // Only assign default grades to COMPLETED prior semesters (< currentSem)
  for (let s = 1; s < currentSem; s++) {
    const list = curriculum.semesters[s] || [];
    list.forEach((c, idx) => {
      grades[c.courseCode] = gradeCycle[(s + idx) % gradeCycle.length];
    });
  }
  return grades;
}

/**
 * Creates or updates a student in students_db.json
 */
export function createOrUpdateStudent({
  firebaseUid,
  fullName,
  uun,
  email,
  programme = 'B.Tech Computer Science and Engineering',
  admissionCohort = '2024'
}) {
  const students = readJson(studentsDbPath, []);
  const cleanUun = normalizeUun(uun);
  const studentId = `st_${cleanUun.toLowerCase()}`;

  // Auto-determine cohort if provided or infer from email/uun (e.g., 2023binni -> 2023)
  let cleanCohort = String(admissionCohort || '2024').replace(/\D/g, '') || '2024';
  if (!admissionCohort || admissionCohort === '2024') {
    const emailMatch = String(email || '').match(/\b(202[2-6])\b/);
    if (emailMatch) {
      cleanCohort = emailMatch[1];
    }
  }

  let existingIndex = students.findIndex(s => 
    s.id === studentId || 
    (s.firebaseUid && s.firebaseUid === firebaseUid) || 
    (s.uun && normalizeUun(s.uun) === cleanUun)
  );

  const timestamp = new Date().toISOString();
  let studentRecord;

  if (existingIndex >= 0) {
    studentRecord = {
      ...students[existingIndex],
      fullName: fullName || students[existingIndex].fullName,
      email: email || students[existingIndex].email,
      programme: programme || students[existingIndex].programme,
      admissionCohort: cleanCohort || students[existingIndex].admissionCohort,
      updatedAt: timestamp
    };
    students[existingIndex] = studentRecord;
  } else {
    studentRecord = {
      id: studentId,
      firebaseUid: firebaseUid || '',
      fullName: fullName.trim(),
      uun: cleanUun,
      canonicalUan: cleanUun.replace('UUN', 'VU24BTECH'),
      email: email.trim().toLowerCase(),
      programme: programme || 'B.Tech Computer Science and Engineering',
      admissionCohort: cleanCohort,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    students.push(studentRecord);

    // Initialize default grades for past completed semesters
    const allGrades = readJson(studentGradesDbPath, {});
    if (!allGrades[studentId]) {
      allGrades[studentId] = createDefaultGradesForCohort(studentRecord.admissionCohort);
      writeJson(studentGradesDbPath, allGrades);
    }
  }

  writeJson(studentsDbPath, students);
  return studentRecord;
}

/**
 * Gets all dynamic registered students with calculated performance.
 */
export function getAllStudents() {
  const students = readJson(studentsDbPath, []);
  const allGrades = readJson(studentGradesDbPath, {});

  return students.map(st => {
    const studentGrades = allGrades[st.id] || {};
    const standing = calculateAcademicStanding(st, studentGrades);

    return {
      id: st.id,
      firebaseUid: st.firebaseUid,
      name: st.fullName,
      fullName: st.fullName,
      displayName: st.fullName,
      uun: st.uun,
      uan: st.canonicalUan || st.uun,
      email: st.email,
      program: st.programme,
      programme: st.programme,
      cohort: `${st.admissionCohort} Batch`,
      admissionCohort: st.admissionCohort,
      currentSemester: standing.currentSemester,
      cgpa: standing.cgpa,
      completedCredits: standing.completedCredits,
      totalCredits: standing.totalCurriculumCredits,
      remainingCredits: standing.remainingCredits,
      standing: standing.academicStatus,
      attendancePercentage: 88,
      failedCourses: standing.backlogs,
      completedCourses: standing.completedCourses,
      semesters: standing.semesterSummaries,
      progression: standing.progression
    };
  });
}

/**
 * Gets a single student by ID, UUN, full name, or Firebase UID.
 */
export function getStudentByIdOrUun(identifier) {
  if (!identifier) return null;
  const all = getAllStudents();
  const raw = String(identifier).trim().toLowerCase();
  const cleanUun = normalizeUun(raw).toLowerCase();

  return all.find(s => 
    s.id.toLowerCase() === raw ||
    s.fullName.toLowerCase() === raw ||
    s.name.toLowerCase() === raw ||
    s.uun.toLowerCase() === cleanUun ||
    (s.uan && s.uan.toLowerCase() === raw) ||
    (s.email && s.email.toLowerCase() === raw) ||
    (s.firebaseUid && s.firebaseUid === identifier)
  ) || null;
}

/**
 * Updates a student profile (Admin only).
 */
export function updateStudentProfile(studentId, updates) {
  const students = readJson(studentsDbPath, []);
  const index = students.findIndex(s => s.id === studentId || s.uun === normalizeUun(studentId));
  if (index === -1) return null;

  const current = students[index];
  const updated = {
    ...current,
    fullName: updates.fullName || current.fullName,
    programme: updates.programme || current.programme,
    admissionCohort: updates.admissionCohort ? String(updates.admissionCohort).replace(/\D/g, '') : current.admissionCohort,
    currentSemesterOverride: updates.currentSemesterOverride !== undefined ? updates.currentSemesterOverride : current.currentSemesterOverride,
    email: updates.email || current.email,
    updatedAt: new Date().toISOString()
  };

  students[index] = updated;
  writeJson(studentsDbPath, students);
  return getStudentByIdOrUun(updated.id);
}

/**
 * Deletes a student and their grades.
 */
export function deleteStudent(studentId) {
  const students = readJson(studentsDbPath, []);
  const cleanUun = normalizeUun(studentId);
  const target = students.find(s => s.id === studentId || s.uun === cleanUun);
  if (!target) return false;

  const remaining = students.filter(s => s.id !== target.id);
  writeJson(studentsDbPath, remaining);

  const allGrades = readJson(studentGradesDbPath, {});
  if (allGrades[target.id]) {
    delete allGrades[target.id];
    writeJson(studentGradesDbPath, allGrades);
  }

  const regs = readJson(registeredUsersPath, []);
  const remainingRegs = regs.filter(r => r.studentProfileId !== target.id && r.uun !== target.uun);
  writeJson(registeredUsersPath, remainingRegs);

  return true;
}

/**
 * Updates grades for a specific semester for a student.
 */
export function updateStudentGrades(studentId, { semester, grades }) {
  const student = getStudentByIdOrUun(studentId);
  if (!student) throw new Error(`Student ${studentId} not found.`);

  const semNum = parseInt(semester, 10);
  if (semNum < 1 || semNum > 8) throw new Error('Invalid semester number (must be 1-8).');

  const allGrades = readJson(studentGradesDbPath, {});
  if (!allGrades[student.id]) {
    allGrades[student.id] = {};
  }

  Object.entries(grades).forEach(([courseCode, grade]) => {
    if (ALLOWED_GRADES.includes(grade) || grade === null) {
      allGrades[student.id][courseCode] = grade;
    }
  });

  writeJson(studentGradesDbPath, allGrades);
  return getStudentByIdOrUun(student.id);
}

/**
 * Resolves a student from natural language queries
 */
export function resolveStudentFromQuery(query) {
  if (!query || typeof query !== 'string') return null;
  const all = getAllStudents();

  // Try matching UUN tokens
  const uunMatch = query.match(/\b(UUN\s*[-_]?\s*\d+|VU\d*BTECH\d+)\b/i);
  if (uunMatch) {
    const found = getStudentByIdOrUun(uunMatch[1]);
    if (found) return found;
  }

  // Try matching full name
  for (const s of all) {
    if (s.fullName && query.toLowerCase().includes(s.fullName.toLowerCase())) {
      return s;
    }
  }

  return null;
}
