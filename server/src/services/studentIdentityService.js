import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const studentsFilePath = path.resolve(__dirname, '../../data/synthetic_students.json');
const registrationsFilePath = path.resolve(__dirname, '../../data/registered_users.json');

/**
 * Normalizes user-input UUN formats (e.g. "UUN01", "UUN 1", "VU24BTECH001", "UUN-01")
 * to the canonical UAN format stored in synthetic_students.json ("VU24BTECH001").
 */
export function normalizeUun(input) {
  if (!input || typeof input !== 'string') return '';
  const clean = input.trim().toUpperCase().replace(/[\s\-_]/g, '');
  
  // If user entered "UUN01" or "UUN1"
  const uunMatch = clean.match(/^UUN(\d+)$/);
  if (uunMatch) {
    const num = parseInt(uunMatch[1], 10);
    return `VU24BTECH${String(num).padStart(3, '0')}`;
  }

  // If user entered already formatted VU24BTECH001
  const directMatch = clean.match(/^VU24BTECH(\d+)$/);
  if (directMatch) {
    const num = parseInt(directMatch[1], 10);
    return `VU24BTECH${String(num).padStart(3, '0')}`;
  }

  return clean;
}

/**
 * Reads registered users and builds an identity resolution lookup.
 */
export function getRegisteredUsers() {
  try {
    if (fs.existsSync(registrationsFilePath)) {
      return JSON.parse(fs.readFileSync(registrationsFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading registered users:', err.message);
  }
  return [];
}

/**
 * Loads mock students and decorates them with dynamic registered student identities.
 * Keeps all original mock marks, GPAs, courses, attendance untouched.
 */
export function getResolvedStudents() {
  let students = [];
  try {
    if (fs.existsSync(studentsFilePath)) {
      students = JSON.parse(fs.readFileSync(studentsFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading students:', err.message);
  }

  const registrations = getRegisteredUsers();

  return students.map(st => {
    // Check if there is an active registration for this student's UAN / profileId
    const reg = registrations.find(r => 
      (r.uun && normalizeUun(r.uun) === normalizeUun(st.uan)) ||
      (r.studentProfileId && r.studentProfileId.toLowerCase() === st.id.toLowerCase())
    );

    if (reg && reg.fullName) {
      return {
        ...st,
        displayName: reg.fullName,
        registeredEmail: reg.email,
        isRegisteredStudent: true,
        originalMockLabel: st.name // e.g. "Student A"
      };
    }

    return {
      ...st,
      displayName: st.name,
      isRegisteredStudent: false,
      originalMockLabel: st.name
    };
  });
}

/**
 * Resolves a query or text mentioning either a registered name (e.g. "Amrit Raj")
 * or a mock identifier (e.g. "Student A" or "UUN01") to the correct mock student object.
 */
export function resolveStudentFromQuery(query) {
  if (!query || typeof query !== 'string') return null;
  const qLower = query.toLowerCase();
  const students = getResolvedStudents();

  // 1. Direct match with registered display names (e.g. "Amrit Raj")
  for (const st of students) {
    if (st.displayName && st.displayName !== st.originalMockLabel) {
      const nameParts = st.displayName.toLowerCase().split(/\s+/).filter(Boolean);
      // Full name match
      if (qLower.includes(st.displayName.toLowerCase())) {
        return st;
      }
      // If full name is at least 2 words (e.g. "Amrit Raj"), require both words
      if (nameParts.length >= 2 && nameParts.every(part => qLower.includes(part))) {
        return st;
      }
    }
  }

  // 2. Direct match with UUN variations (e.g. "UUN01", "VU24BTECH001")
  const uunMatch = query.match(/\b(UUN[\s\-_]?\d+|VU24BTECH\d+)\b/i);
  if (uunMatch) {
    const norm = normalizeUun(uunMatch[1]);
    const found = students.find(s => normalizeUun(s.uan) === norm);
    if (found) return found;
  }

  // 3. Match with mock label (e.g. "Student A")
  const studentLetterMatch = query.match(/\bstudent\s*([a-tA-T])\b/i);
  if (studentLetterMatch) {
    const letter = studentLetterMatch[1].toUpperCase();
    const stId = `student_${letter.toLowerCase()}`;
    const found = students.find(s => s.id === stId);
    if (found) return found;
  }

  return null;
}

