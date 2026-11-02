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
 * Generates an official-looking, professional academic Grade Card PDF
 * covering Semesters 1-7 results, Semester 8 Upcoming, Credit Summary,
 * diagonal AI watermark, and mandatory footer disclaimer.
 *
 * @param {object} student - Student record with resolved dynamic performance
 * @returns {Promise<Buffer>} Generated PDF buffer
 */
export function generateGradeCardPdf(student) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Academic Grade Card - ${student.fullName || student.name}`,
          Author: 'Vidyashilp University Academic Advisor System',
          Subject: 'AI-Generated Mock Grade Card Report'
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const name = student.fullName || student.name || 'Student';
      const uun = student.uun || 'UUN01';
      const program = student.programme || student.program || 'B.Tech Computer Science and Engineering';
      const cohort = student.cohort || `${student.admissionCohort || '2024'} Batch`;
      const cgpa = (student.cgpa !== undefined && student.cgpa !== null ? Number(student.cgpa) : 3.65).toFixed(2);
      const completedCredits = student.completedCredits || 0;
      const totalCredits = student.totalCredits || 160;
      const remainingCredits = student.remainingCredits !== undefined ? student.remainingCredits : Math.max(0, totalCredits - completedCredits);
      const backlogs = student.failedCourses || [];
      const semesters = student.semesters || [];

      function drawWatermark() {
        doc.save();
        doc.rotate(-32, { origin: [297, 420] });
        doc.fontSize(22);
        doc.font('Helvetica-Bold');
        doc.fillColor('#94a3b8');
        doc.fillOpacity(0.14);
        doc.text('AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT', -50, 400, {
          align: 'center',
          width: 700
        });
        doc.restore();
        doc.fillOpacity(1.0);
      }

      // Page 1 Watermark
      drawWatermark();

      // =========================================================================
      // 1. HEADER BANNER
      // =========================================================================
      doc.rect(36, 36, 523, 62).fill('#0b2545');

      doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(15)
         .text('VIDYASHILP UNIVERSITY', 50, 48);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
         .text('OFFICIAL STUDENT ACADEMIC GRADE CARD • SEMESTERS 1–8 REPORT', 50, 68);
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
         .text(`${program} • ${cohort}`, 50, 80);

      // Student box inside header
      doc.rect(380, 44, 165, 46).fillAndStroke('#133e6f', '#1e40af');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
         .text(name, 388, 52, { width: 150, ellipsis: true });
      doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(9)
         .text(`UUN: ${uun}`, 388, 68);

      // =========================================================================
      // 2. ACADEMIC SUMMARY CARDS
      // =========================================================================
      const sumY = 106;
      doc.rect(36, sumY, 523, 44).fillAndStroke('#f8fafc', '#cbd5e1');

      // Metric 1: CGPA
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text('CUMULATIVE CGPA (10 pt)', 48, sumY + 8);
      doc.fillColor('#0b2545').font('Helvetica-Bold').fontSize(14).text(`${cgpa} / 10.0`, 48, sumY + 20);

      // Metric 2: Credits Completed
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text('CREDITS COMPLETED', 145, sumY + 8);
      doc.fillColor('#059669').font('Helvetica-Bold').fontSize(14).text(`${completedCredits}`, 145, sumY + 20);

      // Metric 3: Credits Remaining
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text('CREDITS REMAINING', 255, sumY + 8);
      doc.fillColor('#d97706').font('Helvetica-Bold').fontSize(14).text(`${remainingCredits}`, 255, sumY + 20);

      // Metric 4: Semesters
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text('SEMESTERS COMPLETED', 365, sumY + 8);
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(14).text('7 / 8', 365, sumY + 20);

      // Metric 5: Standing
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text('ACADEMIC STATUS', 460, sumY + 8);
      doc.fillColor(backlogs.length > 0 ? '#b91c1c' : '#059669').font('Helvetica-Bold').fontSize(9.5)
         .text(backlogs.length > 0 ? 'Warning (Backlog)' : 'Good Standing', 460, sumY + 22);

      let curY = sumY + 52;

      // =========================================================================
      // 3. SEMESTER-WISE TABLES (SEMESTERS 1 TO 8)
      // =========================================================================
      for (let s = 1; s <= 8; s++) {
        const isUpcoming = (s === 8);
        const semData = semesters.find(x => x.semester === s) || {
          semester: s,
          sgpa: 3.50,
          totalCredits: 20,
          earnedCredits: 20,
          courses: []
        };
        const courses = semData.courses || [];
        const requiredHeight = 30 + Math.max(1, courses.length) * 16;

        // Auto page break if table exceeds page margin
        if (curY + requiredHeight > 750) {
          doc.addPage();
          drawWatermark();
          curY = 40;
        }

        // Semester Header
        if (isUpcoming) {
          doc.rect(36, curY, 523, 18).fill('#6b21a8');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
             .text('SEMESTER 8 — UPCOMING CURRICULUM (NOT STARTED)', 46, curY + 5);
          doc.fillColor('#e9d5ff').font('Helvetica-Bold').fontSize(8)
             .text('STATUS: UPCOMING', 430, curY + 5, { width: 120, align: 'right' });
        } else {
          doc.rect(36, curY, 523, 18).fill('#0b2545');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
             .text(`SEMESTER ${s}`, 46, curY + 5);
          doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
             .text(`Credits: ${semData.earnedCredits || semData.totalCredits || 0} / ${semData.totalCredits || 0}`, 130, curY + 5);
          doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(8)
             .text(`SGPA: ${semData.sgpa !== null ? semData.sgpa.toFixed(2) : 'N/A'}`, 430, curY + 5, { width: 120, align: 'right' });
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

          const gradeStr = isUpcoming ? 'UPCOMING' : (c.grade || '—');
          const gColor = getGradeColor(gradeStr);
          doc.fillColor(gColor).font('Helvetica-Bold').fontSize(8).text(gradeStr, 465, curY + 4);

          curY += 16;
        });

        curY += 8; // spacing between semester tables
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
           'Disclaimer: This grade card is an AI-generated mock report created for demonstration purposes only. It is not an official university document and should not be considered an authentic academic record. Please verify all academic information with the concerned university or authorized department.',
           46,
           curY + 5,
           { width: 503, align: 'center', lineGap: 1.5 }
         );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
