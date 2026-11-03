import PDFDocument from 'pdfkit';

/**
 * Letter grade color helper for PDF
 */
function getGradeColor(grade) {
  if (!grade) return '#64748b';
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return '#059669';
  if (g.startsWith('B')) return '#2563eb';
  if (g.startsWith('C')) return '#d97706';
  if (g.startsWith('D') || g.startsWith('E')) return '#ea580c';
  if (g.includes('FAIL') || g.startsWith('F')) return '#dc2626';
  if (g === 'UPCOMING') return '#7c3aed';
  return '#475569';
}

/**
 * Generates an official-looking, professional academic Grade Card PDF.
 * If semesterNumber is provided (1-8), generates a Semester-Specific report.
 * Otherwise generates the full report.
 *
 * @param {object} student - Student record with resolved dynamic performance
 * @param {number|null} semesterNumber - Optional specific semester (1 to 8)
 * @param {boolean} completedOnly - Whether to only include completed semesters
 * @returns {Promise<Buffer>} Generated PDF buffer
 */
export function generateGradeCardPdf(student, semesterNumber = null, completedOnly = true) {
  return new Promise((resolve, reject) => {
    try {
      const currentSemester = student.currentSemester || 5;

      // Filter semesters if specific semester requested or completed only
      let targetSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
      if (semesterNumber) {
        targetSemesters = [semesterNumber];
      } else if (completedOnly) {
        targetSemesters = (student.semesters || [])
          .filter(s => s.semester < currentSemester && (s.isCompleted || s.status === 'Completed' || s.sgpa !== null))
          .map(s => s.semester);
        if (targetSemesters.length === 0) {
          targetSemesters = [1];
        }
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: semesterNumber ? `Semester ${semesterNumber} Report - ${student.fullName || student.name}` : `Completed Semesters Report - ${student.fullName || student.name}`,
          Author: 'Vidyashilp University Academic Advisor System',
          Subject: 'AI-Generated Mock Grade Card Report'
        }
      });

      const name = student.fullName || student.name || 'Student';
      const uen = student.uen || student.uun || 'UEN01';
      const program = student.programme || student.program || 'B.Tech Computer Science and Engineering';
      const cohort = student.cohort || `${student.admissionCohort || '2024'} Batch`;
      const cgpa = (student.cgpa !== undefined && student.cgpa !== null ? Number(student.cgpa) : 8.85).toFixed(2);
      const completedCredits = student.completedCredits || 0;
      const totalCredits = student.totalCredits || 160;

      const isSingleUpcoming = semesterNumber && semesterNumber > currentSemester;

      // =========================================================================
      // WATERMARK DRAWING FUNCTION
      // =========================================================================
      const drawWatermark = () => {
        doc.save();
        doc.fillColor('#64748b', 0.08);
        doc.font('Helvetica-Bold').fontSize(26);
        doc.rotate(-28, { origin: [297, 420] });
        doc.text('AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT', -50, 410, {
          align: 'center',
          width: 700
        });
        doc.restore();
      };

      drawWatermark();

      // =========================================================================
      // 1. UNIVERSITY & REPORT HEADER
      // =========================================================================
      const headerColor = isSingleUpcoming ? '#581c87' : '#0b2545';
      doc.rect(36, 36, 523, 70).fill(headerColor);

      // Gold institution label
      doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(14)
         .text('VIDYASHILP UNIVERSITY', 50, 48);

      const headerTitle = semesterNumber 
        ? (isSingleUpcoming ? `UPCOMING SEMESTER ${semesterNumber} COURSE REPORT` : `OFFICIAL SEMESTER ${semesterNumber} ACADEMIC GRADE CARD`)
        : 'OFFICIAL STUDENT ACADEMIC GRADE CARD';

      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
         .text(headerTitle, 50, 68);

      doc.fillColor('#93c5fd').font('Helvetica').fontSize(8.5)
         .text(`Programme: ${program}   |   Admission Batch: ${cohort}   |   Current Semester: ${currentSemester}`, 50, 84);

      // Student info pill in header right
      doc.rect(385, 46, 164, 48).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fillColor('#0b2545').font('Helvetica-Bold').fontSize(10)
         .text(name, 392, 53, { width: 150, ellipsis: true });
      doc.fillColor('#d97706').font('Courier-Bold').fontSize(9)
         .text(`UEN: ${uen}`, 392, 69);
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5)
         .text(`Batch: ${cohort}`, 392, 81);

      // Upcoming notice banner if single upcoming semester
      let curY = 114;
      if (isSingleUpcoming) {
        doc.rect(36, curY, 523, 30).fillAndStroke('#faf5ff', '#c084fc');
        doc.fillColor('#7e22ce').font('Helvetica-Bold').fontSize(8.5)
           .text('THIS SEMESTER IS NOT YET COMPLETED. GRADES AND GPA ARE NOT AVAILABLE.', 46, curY + 6, { align: 'center', width: 503 });
        doc.fillColor('#6b21a8').font('Helvetica').fontSize(7.5)
           .text(`Official prospective curriculum overview for Semester ${semesterNumber} (${cohort} Batch).`, 46, curY + 18, { align: 'center', width: 503 });
        curY += 38;
      }

      // =========================================================================
      // 2. METRIC SUMMARY STRIP
      // =========================================================================
      const boxW = 125;
      const boxH = 40;
      const gap = 8;
      let left = 36;

      // Box 1: CGPA
      doc.rect(left, curY, boxW, boxH).fill('#0b2545');
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(7.5).text('CUMULATIVE CGPA', left + 8, curY + 6);
      doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(13).text(`${cgpa}`, left + 8, curY + 18);
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text('/ 10.00', left + 54, curY + 22);
      left += boxW + gap;

      // Box 2: Credits
      doc.rect(left, curY, boxW, boxH).fill('#f8fafc');
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text('COMPLETED CREDITS', left + 8, curY + 6);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(`${completedCredits} / ${totalCredits}`, left + 8, curY + 20);
      left += boxW + gap;

      // Box 3: Current Semester
      doc.rect(left, curY, boxW, boxH).fill('#f8fafc');
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text('CURRENT ENROLLMENT', left + 8, curY + 6);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(`Semester ${currentSemester}`, left + 8, curY + 20);
      left += boxW + gap;

      // Box 4: Academic Status
      doc.rect(left, curY, boxW, boxH).fill('#f8fafc');
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text('ACADEMIC STATUS', left + 8, curY + 6);
      doc.fillColor(student.failedCourses && student.failedCourses.length > 0 ? '#b91c1c' : '#15803d')
         .font('Helvetica-Bold').fontSize(9.5)
         .text(student.failedCourses && student.failedCourses.length > 0 ? 'Warning (Backlog)' : 'Good Standing', left + 8, curY + 21);

      curY += boxH + 14;

      // =========================================================================
      // 3. SEMESTER COURSE TABLES
      // =========================================================================
      const semMap = {};
      (student.semesters || []).forEach(s => { semMap[s.semester] = s; });

      for (const s of targetSemesters) {
        const semData = semMap[s] || { semester: s, isUpcoming: s > currentSemester, courses: [] };
        const courses = semData.courses || [];
        const isUpcoming = semData.isUpcoming || s > currentSemester;
        const isCurrent = s === currentSemester;

        const tableHeight = 32 + Math.max(1, courses.length) * 16 + 10;
        if (curY + tableHeight > 740) {
          doc.addPage();
          drawWatermark();
          curY = 36;
        }

        // Semester Subheader Bar
        if (isUpcoming) {
          doc.rect(36, curY, 523, 18).fill('#581c87');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
             .text(`SEMESTER ${s} (UPCOMING)`, 46, curY + 5);
          doc.fillColor('#e9d5ff').font('Helvetica').fontSize(8)
             .text(`Total Credits: ${semData.totalCredits || 0}`, 160, curY + 5);
          doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(8)
             .text('STATUS: UPCOMING', 430, curY + 5, { width: 120, align: 'right' });
        } else {
          doc.rect(36, curY, 523, 18).fill('#0b2545');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
             .text(`SEMESTER ${s}`, 46, curY + 5);
          doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
             .text(`Credits: ${semData.earnedCredits || semData.totalCredits || 0} / ${semData.totalCredits || 0}`, 130, curY + 5);
          doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(8)
             .text(semData.sgpa !== null ? `SGPA: ${Number(semData.sgpa).toFixed(2)}` : (isCurrent ? 'Current' : 'N/A'), 430, curY + 5, { width: 120, align: 'right' });
        }

        curY += 18;

        // Table Header
        doc.rect(36, curY, 523, 14).fill('#f1f5f9');
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5);
        doc.text('CODE', 46, curY + 3);
        doc.text('OFFICIAL COURSE TITLE', 120, curY + 3);
        doc.text('CREDITS', 400, curY + 3);
        doc.text('GRADE / STATUS', 465, curY + 3);

        curY += 14;

        // Course Rows
        courses.forEach((c, idx) => {
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(36, curY, 523, 16).fill(rowBg);

          doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(c.courseCode, 46, curY + 4);
          doc.fillColor('#334155').font('Helvetica').fontSize(8).text(c.courseName, 120, curY + 4, { width: 270, ellipsis: true });
          doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(`${c.credits}`, 410, curY + 4);

          const gradeStr = isUpcoming ? 'UPCOMING' : (c.grade || (isCurrent ? 'In Progress' : '—'));
          const gColor = getGradeColor(gradeStr);
          doc.fillColor(gColor).font('Helvetica-Bold').fontSize(8).text(gradeStr, 465, curY + 4);

          curY += 16;
        });

        curY += 8;
      }

      // =========================================================================
      // 4. BOTTOM MANDATORY DISCLAIMER
      // =========================================================================
      if (curY > 740) {
        doc.addPage();
        drawWatermark();
        curY = 740;
      } else {
        curY = Math.max(curY + 10, 755);
      }

      doc.rect(36, curY, 523, 34).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5)
         .text(
           'This academic report is AI-generated for demonstration purposes only. AI-generated information may contain errors. Please independently verify all academic details with the official university records.',
           46,
           curY + 7,
           { width: 503, align: 'center', lineGap: 1.5 }
         );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
