import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCurriculumForCohort } from './curriculumService.js';

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
 * Standard Indian University 10-Point Grading System:
 * A+ -> 10.0 (Outstanding)
 * A  -> 9.0  (Excellent)
 * B+ -> 8.0  (Very Good)
 * B  -> 7.0  (Good)
 * C  -> 6.0  (Above Average)
 * D  -> 5.0  (Average / Pass)
 * E  -> 4.0  (Marginal Pass)
 * Fail / Backlog -> 0.0
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
  'F': 0.0
};

/**
 * Calculates semester SGPA and cumulative CGPA from grades.
 * Excludes ungraded courses and Semester 8 (UPCOMING).
 */
export function calculateAcademicStanding(student, allGradesForStudent) {
  const cohort = student.admissionCohort || student.cohort || '2024';
  const curriculum = getCurriculumForCohort(cohort);

  let totalQualityPoints = 0;
  let totalGradedCredits = 0;
  let completedCredits = 0;
  let totalCurriculumCredits = 0;
  const semesterSummaries = [];
  const backlogs = [];
  const completedCourses = [];

  for (let s = 1; s <= 8; s++) {
    const courses = curriculum.semesters[s] || [];
    const isUpcoming = (s === 8);
    let semQualityPoints = 0;
    let semGradedCredits = 0;
    let semEarnedCredits = 0;
    let semTotalCredits = 0;

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
      if (!assignedGrade) {
        return {
          ...c,
          grade: null,
          status: 'Pending',
          gradePoints: null
        };
      }

      const isFail = assignedGrade === 'Fail / Backlog' || assignedGrade === 'F';
      const pts = GRADE_POINT_MAP[assignedGrade] !== undefined ? GRADE_POINT_MAP[assignedGrade] : (isFail ? 0.0 : 3.0);

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

    const sgpa = semGradedCredits > 0 ? Number((semQualityPoints / semGradedCredits).toFixed(2)) : null;

    if (!isUpcoming && semGradedCredits > 0) {
      totalQualityPoints += semQualityPoints;
      totalGradedCredits += semGradedCredits;
    }

    semesterSummaries.push({
      semester: s,
      isUpcoming,
      status: isUpcoming ? 'UPCOMING' : (semGradedCredits > 0 ? 'Completed' : 'Pending'),
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
    completedSemesters: 7,
    upcomingSemesters: 1,
    backlogs,
    completedCourses,
    semesterSummaries,
    academicStatus: backlogs.length > 0 ? 'Academic Warning (Backlog)' : 'Good Standing'
  };
}

/**
 * Initializes default passing grades for Semesters 1 to 7 upon student registration.
 * Ensures initial grade card and reports are complete and valid.
 */
function createDefaultGradesForCohort(cohort) {
  const curriculum = getCurriculumForCohort(cohort);
  const grades = {};
  const gradeCycle = ['A+', 'A', 'B+', 'A', 'B+', 'A', 'A+', 'B'];

  for (let s = 1; s <= 7; s++) {
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
      admissionCohort: admissionCohort || students[existingIndex].admissionCohort,
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
      admissionCohort: admissionCohort || '2024',
      currentSemester: 8,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    students.push(studentRecord);

    // Initialize default grades for Semesters 1-7
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
      currentSemester: st.currentSemester || 8,
      cgpa: standing.cgpa,
      completedCredits: standing.completedCredits,
      totalCredits: standing.totalCurriculumCredits,
      remainingCredits: standing.remainingCredits,
      standing: standing.academicStatus,
      attendancePercentage: 88,
      failedCourses: standing.backlogs,
      completedCourses: standing.completedCourses,
      semesters: standing.semesterSummaries,
      sem1_gpa: standing.semesterSummaries[0]?.sgpa || 9.10,
      sem2_gpa: standing.semesterSummaries[1]?.sgpa || 8.90,
      sem3_gpa: standing.semesterSummaries[2]?.sgpa || 8.85,
      sem4_gpa: standing.semesterSummaries[3]?.sgpa || 9.00,
      sem5_gpa: standing.semesterSummaries[4]?.sgpa || 8.95,
      sem6_gpa: standing.semesterSummaries[5]?.sgpa || 9.05,
      sem7_gpa: standing.semesterSummaries[6]?.sgpa || 9.20
    };
  });
}

/**
 * Gets a single student by ID, UUN, or full name.
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
    fullName: updates.fullName !== undefined ? updates.fullName.trim() : current.fullName,
    programme: updates.programme !== undefined ? updates.programme.trim() : current.programme,
    admissionCohort: updates.admissionCohort !== undefined ? updates.admissionCohort.trim() : current.admissionCohort,
    updatedAt: new Date().toISOString()
  };

  students[index] = updated;
  writeJson(studentsDbPath, students);
  return getStudentByIdOrUun(updated.id);
}

/**
 * Deletes a student and their academic records (Admin only).
 */
export function deleteStudent(studentId) {
  const students = readJson(studentsDbPath, []);
  const index = students.findIndex(s => s.id === studentId || s.uun === normalizeUun(studentId));
  if (index === -1) return false;

  const targetId = students[index].id;
  const targetUun = students[index].uun;
  const targetUid = students[index].firebaseUid;

  // 1. Remove from students_db.json
  const remainingStudents = students.filter(s => s.id !== targetId);
  writeJson(studentsDbPath, remainingStudents);

  // 2. Remove grades from student_grades_db.json
  const allGrades = readJson(studentGradesDbPath, {});
  delete allGrades[targetId];
  writeJson(studentGradesDbPath, allGrades);

  // 3. Remove registration from registered_users.json
  const regs = readJson(registeredUsersPath, []);
  const remainingRegs = regs.filter(r => r.uid !== targetUid && normalizeUun(r.uun) !== targetUun);
  writeJson(registeredUsersPath, remainingRegs);

  return true;
}

/**
 * Updates grades for a student (Admin only).
 * Semester 8 is locked and rejected if grade modification is attempted.
 */
export function updateStudentGrades(studentId, { semester, grades }) {
  if (Number(semester) === 8) {
    throw new Error('Semester 8 is marked as UPCOMING. Assigning grades is not permitted.');
  }

  const student = getStudentByIdOrUun(studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found.`);
  }

  const allGrades = readJson(studentGradesDbPath, {});
  if (!allGrades[student.id]) {
    allGrades[student.id] = {};
  }

  // Merge course grades
  Object.entries(grades).forEach(([courseCode, grade]) => {
    if (grade && typeof grade === 'string') {
      allGrades[student.id][courseCode.trim()] = grade.trim();
    }
  });

  writeJson(studentGradesDbPath, allGrades);
  return getStudentByIdOrUun(student.id);
}

/**
 * Resolves a student from natural language queries (e.g. "Show me the details of Nitin Kumar").
 */
export function resolveStudentFromQuery(query) {
  if (!query || typeof query !== 'string') return null;
  const students = getAllStudents();
  const qLower = query.toLowerCase();

  // 1. Exact or substring full name match
  for (const st of students) {
    if (st.fullName && qLower.includes(st.fullName.toLowerCase())) {
      return st;
    }
  }

  // 2. UUN match (e.g. "uun01", "uun 01", "uun1")
  const uunMatch = query.match(/\buun[\s\-_]*0*(\d+)\b/i);
  if (uunMatch) {
    const normalized = `UUN${String(parseInt(uunMatch[1], 10)).padStart(2, '0')}`;
    const found = students.find(s => s.uun === normalized);
    if (found) return found;
  }

  // 3. Partial first name match if unambiguous
  for (const st of students) {
    const parts = st.fullName.toLowerCase().split(/\s+/);
    if (parts.length > 0 && parts[0].length >= 3) {
      const re = new RegExp(`\\b${parts[0]}\\b`, 'i');
      if (re.test(query)) {
        return st;
      }
    }
  }

  return null;
}

