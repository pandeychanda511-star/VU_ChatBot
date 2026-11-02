import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, ADMIN_EMAIL } from '../middleware/auth.js';
import { 
  normalizeUun, 
  createOrUpdateStudent, 
  getStudentByIdOrUun 
} from '../services/studentDatabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const registrationsFilePath = path.resolve(__dirname, '../../data/registered_users.json');

function loadRegistrations() {
  try {
    if (fs.existsSync(registrationsFilePath)) {
      return JSON.parse(fs.readFileSync(registrationsFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed reading registrations:', err.message);
  }
  return [];
}

function saveRegistrations(regs) {
  try {
    fs.writeFileSync(registrationsFilePath, JSON.stringify(regs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing registrations:', err.message);
  }
}

/**
 * POST /api/auth/verify-uun
 * Validates whether a provided UUN is syntactically valid and available.
 */
router.post('/verify-uun', (req, res) => {
  const { uun } = req.body;
  if (!uun || typeof uun !== 'string') {
    return res.status(400).json({ error: 'UUN number is required.' });
  }

  const rawUun = uun.trim();
  const cleanUun = normalizeUun(rawUun);

  if (!cleanUun || cleanUun.length < 3) {
    return res.status(400).json({
      valid: false,
      error: `Invalid UUN format "${rawUun}". Please enter a valid University Unique Number (e.g. UUN01, VU24BTECH001).`
    });
  }

  // Check if already registered by another user
  const registrations = loadRegistrations();
  const existing = registrations.find(r => normalizeUun(r.uun) === cleanUun);
  if (existing) {
    return res.status(409).json({
      valid: false,
      error: `UUN "${rawUun}" is already registered to account ${existing.email}. Please sign in or contact the university administrator.`
    });
  }

  return res.status(200).json({
    valid: true,
    uun: cleanUun,
    userProvidedUun: rawUun,
    program: 'B.Tech Computer Science and Engineering',
    admissionCohort: '2024'
  });
});

/**
 * POST /api/auth/register-student
 * Automatically creates student record in students_db.json and links Firebase UID.
 */
router.post('/register-student', authenticateToken, (req, res) => {
  const { uun, fullName, programme, admissionCohort } = req.body;
  const user = req.user;

  if (user.role === 'admin') {
    return res.status(200).json({
      status: 'success',
      role: 'admin',
      message: 'Admin account confirmed.'
    });
  }

  if (!uun) {
    return res.status(400).json({ error: 'UUN number is required to register as a student.' });
  }

  const rawUun = uun.trim();
  const cleanUun = normalizeUun(rawUun);

  const registrations = loadRegistrations();
  // Check if UUN already claimed by a different user
  const uunClaimed = registrations.find(r => normalizeUun(r.uun) === cleanUun && r.uid !== user.uid);
  if (uunClaimed) {
    return res.status(409).json({
      error: `UUN "${rawUun}" is already registered with another account.`
    });
  }

  const studentName = fullName || user.name || 'New Student';
  const cohort = admissionCohort || '2024';
  const prog = programme || 'B.Tech Computer Science and Engineering';

  // 1. Create or update in dynamic database (students_db.json & student_grades_db.json)
  const studentRecord = createOrUpdateStudent({
    firebaseUid: user.uid,
    fullName: studentName,
    uun: cleanUun,
    email: user.email,
    programme: prog,
    admissionCohort: cohort
  });

  // 2. Save in registered_users.json for session persistence
  const existingIndex = registrations.findIndex(r => r.uid === user.uid);
  const regRecord = {
    uid: user.uid,
    email: user.email,
    fullName: studentName,
    uun: cleanUun,
    userUunInput: rawUun,
    studentProfileId: studentRecord.id,
    programme: prog,
    admissionCohort: cohort,
    registeredAt: new Date().toISOString(),
    role: 'student'
  };

  if (existingIndex >= 0) {
    registrations[existingIndex] = regRecord;
  } else {
    registrations.push(regRecord);
  }
  saveRegistrations(registrations);

  const fullStudentData = getStudentByIdOrUun(studentRecord.id);

  return res.status(200).json({
    status: 'success',
    role: 'student',
    profile: regRecord,
    studentDetails: fullStudentData
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user session, role, and linked student data.
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(200).json({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: 'admin',
      isAdmin: true
    });
  }

  // Look up registered student record
  const registrations = loadRegistrations();
  const reg = registrations.find(r => r.uid === user.uid || (r.email && r.email.toLowerCase() === user.email.toLowerCase()));

  if (!reg) {
    return res.status(200).json({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: 'student',
      isRegistered: false,
      message: 'Student account requires UUN registration.'
    });
  }

  const studentData = getStudentByIdOrUun(reg.uun) || getStudentByIdOrUun(reg.studentProfileId);

  return res.status(200).json({
    uid: user.uid,
    email: user.email,
    name: reg.fullName || user.name,
    role: 'student',
    isRegistered: true,
    uun: reg.uun,
    studentProfileId: reg.studentProfileId,
    studentData
  });
});

export default router;
