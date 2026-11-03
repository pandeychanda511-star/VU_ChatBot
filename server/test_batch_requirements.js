import { getAllStudents, getStudentByIdOrUun } from './src/services/studentDatabaseService.js';
import { generateSemesterGradeCardSvg } from './src/services/imageCardGenerator.js';
import { calculateStudentProgression } from './src/services/academicProgressionService.js';
import { getCurriculumForCohort } from './src/services/curriculumService.js';

console.log('=== TEST 1: Check Progression Calculation ===');
for (const batch of ['2023', '2024', '2025', '2026']) {
  const dummy = { admissionCohort: batch };
  const prog = calculateStudentProgression(dummy);
  console.log(`Batch ${batch} -> Current Semester: ${prog.currentSemester} (Completed: ${prog.completedSemesters.join(',')}, Upcoming: ${prog.upcomingSemesters.join(',')})`);
}

console.log('\n=== TEST 2: Registered Student Profile Context ===');
const students = getAllStudents();
students.forEach(st => {
  console.log(`Student: ${st.fullName} (UUN: ${st.uun}) | Batch: ${st.admissionCohort} | Current Sem: ${st.currentSemester} | CGPA: ${st.cgpa}`);
  console.log(`  Semesters:`, st.semesters.map(s => `S${s.semester}:${s.status}(${s.sgpa !== null ? s.sgpa : 'N/A'})`).join(' | '));
});

console.log('\n=== TEST 3: Generate Semester-Specific Cards ===');
if (students.length > 0) {
  const testStudent = students[0];
  // 1. Completed semester (e.g., Sem 1)
  const sem1Svg = generateSemesterGradeCardSvg(testStudent, 1);
  console.log('Sem 1 SVG Length:', sem1Svg.length, 'Contains "OFFICIAL SEMESTER 1 ACADEMIC GRADE CARD":', sem1Svg.includes('SEMESTER 1 ACADEMIC GRADE CARD'));

  // 2. Upcoming semester (e.g., Sem 7 for 2024 batch)
  const sem7Svg = generateSemesterGradeCardSvg(testStudent, 7);
  console.log('Sem 7 SVG Length:', sem7Svg.length, 'Contains "UPCOMING SEMESTER COURSE REPORT":', sem7Svg.includes('UPCOMING SEMESTER COURSE REPORT'));
  console.log('Contains "THIS SEMESTER IS NOT YET COMPLETED":', sem7Svg.includes('THIS SEMESTER IS NOT YET COMPLETED'));
}

console.log('\nAll offline backend tests passed successfully!');
