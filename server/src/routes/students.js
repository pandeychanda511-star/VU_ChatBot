import express from 'express';
import { 
  generateStudentGradeCardSvg, 
  generateSemesterGradeCardSvg,
  generateSemesterCoursesSvg 
} from '../services/imageCardGenerator.js';
import { generateGradeCardPdf } from '../services/gradeCardPdfService.js';
import { authenticateToken, requireAdmin, optionalAuthenticateToken } from '../middleware/auth.js';
import { 
  getAllStudents, 
  getStudentByIdOrUun, 
  updateStudentProfile, 
  deleteStudent, 
  updateStudentGrades,
  normalizeUun
} from '../services/studentDatabaseService.js';
import { 
  getAcademicCycleConfig, 
  updateAcademicCycleConfig 
} from '../services/academicProgressionService.js';
import { getCurriculumForCohort } from '../services/curriculumService.js';

const router = express.Router();

/**
 * GET /api/students
 * Returns all dynamically registered students from database.
 * No predefined mock students are returned.
 */
router.get('/', optionalAuthenticateToken, (req, res) => {
  const students = getAllStudents();
  res.status(200).json({
    total: students.length,
    students
  });
});

/**
 * GET /api/students/academic-config
 * Returns current university academic session and batch-progression mapping.
 */
router.get('/academic-config', optionalAuthenticateToken, (req, res) => {
  const cfg = getAcademicCycleConfig();
  res.status(200).json(cfg);
});

/**
 * PUT /api/students/academic-config
 * Admin updates academic cycle configuration.
 */
router.put('/academic-config', authenticateToken, requireAdmin, (req, res) => {
  try {
    const updated = updateAcademicCycleConfig(req.body);
    res.status(200).json({
      message: 'Academic cycle configuration updated successfully.',
      config: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/students/:id
 * Retrieves a single student record with full semester results and progression status.
 * RBAC: Students can only view their own record. Admins can view any record.
 */
router.get('/:id', optionalAuthenticateToken, (req, res) => {
  const student = getStudentByIdOrUun(req.params.id);
  if (!student) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  // RBAC check
  if (req.user && req.user.role === 'student') {
    if (req.user.uid !== student.firebaseUid && normalizeUun(req.user.uun) !== normalizeUun(student.uun)) {
      return res.status(403).json({ error: 'Access denied. You can only view your own academic profile.' });
    }
  }

  res.status(200).json(student);
});

/**
 * PUT /api/students/:id
 * Admin updates a student profile (Name, Programme, Admission Cohort, Semester Override).
 */
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { fullName, programme, admissionCohort, currentSemesterOverride, email } = req.body;
  const updatedStudent = updateStudentProfile(req.params.id, {
    fullName,
    programme,
    admissionCohort,
    currentSemesterOverride: currentSemesterOverride ? parseInt(currentSemesterOverride, 10) : undefined,
    email
  });

  if (!updatedStudent) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  res.status(200).json({
    message: 'Student profile updated successfully.',
    student: updatedStudent
  });
});

/**
 * DELETE /api/students/:id
 * Admin deletes a student and all associated academic records.
 */
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const success = deleteStudent(req.params.id);
  if (!success) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found or already deleted.` });
  }

  res.status(200).json({
    message: `Student and all associated academic records deleted successfully.`,
    studentId: req.params.id
  });
});

/**
 * GET /api/students/:id/curriculum
 * Returns the official curriculum structure for the student's cohort.
 */
router.get('/:id/curriculum', optionalAuthenticateToken, (req, res) => {
  const student = getStudentByIdOrUun(req.params.id);
  if (!student) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  const curriculum = getCurriculumForCohort(student.admissionCohort || student.cohort);
  res.status(200).json(curriculum);
});

/**
 * PUT /api/students/:id/grades
 * Admin updates grades for a specific semester (Semesters 1 to 7).
 */
router.put('/:id/grades', authenticateToken, requireAdmin, (req, res) => {
  const { semester, grades } = req.body;

  if (!semester || !grades || typeof grades !== 'object') {
    return res.status(400).json({ error: 'Semester number and course grades object are required.' });
  }

  const semNum = parseInt(semester, 10);
  if (semNum < 1 || semNum > 8) {
    return res.status(400).json({ error: 'Valid semester range is 1 to 8.' });
  }

  try {
    const updatedStudent = updateStudentGrades(req.params.id, { semester: semNum, grades });
    return res.status(200).json({
      message: `Semester ${semNum} grades updated successfully.`,
      student: updatedStudent
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/students/:id/card-image
 * Query params: ?semester=1..8 (If omitted, generates full card or current semester)
 * Dynamically generates and returns SVG grade card.
 */
router.get('/:id/card-image', optionalAuthenticateToken, (req, res) => {
  const student = getStudentByIdOrUun(req.params.id);
  if (!student) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  // Security check for student role
  if (req.user && req.user.role === 'student') {
    if (req.user.uid !== student.firebaseUid && normalizeUun(req.user.uun) !== normalizeUun(student.uun)) {
      return res.status(403).json({ error: 'Access denied. You can only view your own grade card.' });
    }
  }

  const reqSem = req.query.semester ? parseInt(req.query.semester, 10) : null;
  let svg;
  if (reqSem && reqSem >= 1 && reqSem <= 8) {
    svg = generateSemesterGradeCardSvg(student, reqSem);
  } else {
    svg = generateStudentGradeCardSvg(student);
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(svg);
});

/**
 * GET /api/students/:id/card-pdf
 */
router.get('/:id/card-pdf', optionalAuthenticateToken, async (req, res) => {
  const student = getStudentByIdOrUun(req.params.id);
  if (!student) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  if (req.user && req.user.role === 'student') {
    if (req.user.uid !== student.firebaseUid && normalizeUun(req.user.uun) !== normalizeUun(student.uun)) {
      return res.status(403).json({ error: 'Access denied. You can only download your own grade card.' });
    }
  }

  try {
    const pdfBuffer = await generateGradeCardPdf(student);
    const safeFilename = `${(student.fullName || student.name || 'Student').replace(/\s+/g, '_')}_Grade_Card.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate Grade Card PDF' });
  }
});

export default router;
