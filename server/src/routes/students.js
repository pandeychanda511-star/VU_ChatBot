import express from 'express';
import { generateStudentGradeCardSvg, generateSemesterCoursesSvg } from '../services/imageCardGenerator.js';
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
 * GET /api/students/:id
 * Retrieves a single student record with full 8-semester results.
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
 * Admin updates student basic information (Full Name, Programme, Cohort).
 */
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { fullName, programme, admissionCohort } = req.body;
  const updated = updateStudentProfile(req.params.id, {
    fullName,
    programme,
    admissionCohort
  });

  if (!updated) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  res.status(200).json({
    message: 'Student profile updated successfully.',
    student: updated
  });
});

/**
 * DELETE /api/students/:id
 * Admin securely deletes a student and their academic results.
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
 * Semester 8 is locked and rejected.
 */
router.put('/:id/grades', authenticateToken, requireAdmin, (req, res) => {
  const { semester, grades } = req.body;

  if (!semester || !grades || typeof grades !== 'object') {
    return res.status(400).json({ error: 'Semester number and course grades object are required.' });
  }

  const semNum = parseInt(semester, 10);
  if (semNum === 8) {
    return res.status(400).json({
      error: 'Semester 8 is marked as UPCOMING. Assigning grades is not permitted until the semester is active.'
    });
  }

  if (semNum < 1 || semNum > 7) {
    return res.status(400).json({ error: 'Valid semester range for grade management is 1 to 7.' });
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
 * Dynamically generates and returns the latest academic report card SVG.
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

  const svg = generateStudentGradeCardSvg(student);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(svg);
});

/**
 * GET /api/students/:id/card-pdf
 * Dynamically generates and returns downloadable Grade Card PDF.
 */
router.get('/:id/card-pdf', optionalAuthenticateToken, async (req, res) => {
  const student = getStudentByIdOrUun(req.params.id);
  if (!student) {
    return res.status(404).json({ error: `Student '${req.params.id}' not found.` });
  }

  // Security check for student role
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
