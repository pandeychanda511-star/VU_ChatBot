/**
 * Helper to escape XML / SVG special characters
 */
function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Letter grade badge color utility
 */
function getGradeColor(grade) {
  if (!grade) return '#64748b';
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return '#059669'; // Emerald
  if (g.startsWith('B')) return '#2563eb'; // Blue
  if (g.startsWith('C')) return '#d97706'; // Amber
  if (g.startsWith('D') || g.startsWith('E')) return '#ea580c'; // Orange
  if (g.includes('FAIL') || g.startsWith('F')) return '#dc2626'; // Red
  if (g === 'UPCOMING') return '#9333ea'; // Purple
  return '#475569';
}

/**
 * Generates Semester-Specific Grade Card SVG (Only the requested semester)
 *
 * Rules:
 * - Generates ONLY the requested semester information.
 * - If Upcoming: Distinct layout titled "UPCOMING SEMESTER COURSE REPORT" with prominent notice:
 *   "THIS SEMESTER IS NOT YET COMPLETED. GRADES AND GPA ARE NOT AVAILABLE."
 * - If Completed / Current: Shows official Course Code, Name, Credits, Grade Obtained, SGPA, Total Credits.
 * - Watermark: "AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT"
 * - Disclaimer included.
 */
export function generateSemesterGradeCardSvg(student, semesterNumber) {
  const name = student.fullName || student.displayName || student.name || 'Student';
  const uen = student.uen || 'UEN01';
  const program = student.programme || student.program || 'B.Tech Computer Science and Engineering';
  const cohort = student.cohort || `${student.admissionCohort || '2024'} Batch`;
  const currentSemester = student.currentSemester || 5;

  const semSummary = (student.semesters || []).find(s => s.semester === semesterNumber) || {
    semester: semesterNumber,
    isUpcoming: semesterNumber > currentSemester,
    isCurrent: semesterNumber === currentSemester,
    courses: [],
    sgpa: null,
    totalCredits: 0,
    earnedCredits: 0
  };

  const isUpcoming = semSummary.isUpcoming || semesterNumber > currentSemester;
  const isCurrent = semSummary.isCurrent || semesterNumber === currentSemester;
  const courses = semSummary.courses || [];
  const sgpa = semSummary.sgpa !== null && semSummary.sgpa !== undefined ? Number(semSummary.sgpa).toFixed(2) : null;
  const earnedCredits = semSummary.earnedCredits || 0;
  const totalCredits = semSummary.totalCredits || courses.reduce((acc, c) => acc + (c.credits || 0), 0);

  const width = 1000;
  const rowHeight = 36;
  const courseListHeight = Math.max(1, courses.length) * rowHeight;
  const baseHeight = isUpcoming ? 460 : 440;
  const finalHeight = baseHeight + courseListHeight;

  // Header Title
  const headerMainTitle = isUpcoming ? 'UPCOMING SEMESTER COURSE REPORT' : `OFFICIAL SEMESTER ${semesterNumber} ACADEMIC GRADE CARD`;
  const headerGradColor = isUpcoming ? 'url(#upcomingHeaderGrad)' : 'url(#headerGrad)';

  // Build Course Rows SVG
  let coursesSvg = '';
  courses.forEach((c, idx) => {
    const yPos = 40 + idx * rowHeight;
    const bgFill = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    const gradeVal = isUpcoming ? 'UPCOMING' : (c.grade || (isCurrent ? 'In Progress' : 'Pending'));
    const gradeColor = isUpcoming ? '#9333ea' : getGradeColor(c.grade);

    coursesSvg += `
    <g transform="translate(0, ${yPos})">
      <rect width="900" height="34" rx="6" fill="${bgFill}"/>
      <text x="24" y="22" font-family="monospace" font-size="12" font-weight="700" fill="#0f172a">${escapeXml(c.courseCode)}</text>
      <text x="180" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#334155">${escapeXml(c.courseName)}</text>
      <text x="710" y="22" font-family="monospace" font-size="12" font-weight="600" fill="#475569" text-anchor="middle">${c.credits || 0}</text>
      
      <!-- Grade Pill -->
      <g transform="translate(830, 7)">
        <rect x="-42" y="0" width="84" height="20" rx="10" fill="${gradeColor}" fill-opacity="0.15" stroke="${gradeColor}" stroke-width="1.2"/>
        <text x="0" y="14" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="800" fill="${gradeColor}" text-anchor="middle">
          ${escapeXml(gradeVal)}
        </text>
      </g>
    </g>
    `;
  });

  // Upcoming Banner
  const upcomingNoticeSvg = isUpcoming ? `
    <g transform="translate(50, 150)">
      <rect width="900" height="50" rx="12" fill="#faf5ff" stroke="#c084fc" stroke-width="1.5"/>
      <circle cx="36" cy="25" r="14" fill="#9333ea"/>
      <text x="36" y="30" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">!</text>
      <text x="64" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#6b21a8">
        THIS SEMESTER IS NOT YET COMPLETED. GRADES AND GPA ARE NOT AVAILABLE.
      </text>
      <text x="64" y="40" font-family="system-ui, sans-serif" font-size="10.5" font-weight="600" fill="#7e22ce">
        Current Progression: Semester ${currentSemester} • This is an official syllabus overview for upcoming academic planning.
      </text>
    </g>
  ` : '';

  // Stats / Metric Cards
  const statsStartY = isUpcoming ? 215 : 150;
  const statsCardsSvg = isUpcoming ? `
    <g transform="translate(50, ${statsStartY})">
      <!-- Card 1: Requested Semester -->
      <g transform="translate(0, 0)">
        <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b" text-transform="uppercase">SEMESTER</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a">Semester ${semesterNumber}</text>
      </g>
      <!-- Card 2: Status -->
      <g transform="translate(230, 0)">
        <rect width="210" height="64" rx="12" fill="#faf5ff" stroke="#e9d5ff"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#7c3aed" text-transform="uppercase">ACADEMIC STATUS</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="17" font-weight="900" fill="#7c3aed">UPCOMING</text>
      </g>
      <!-- Card 3: Total Credits -->
      <g transform="translate(460, 0)">
        <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b" text-transform="uppercase">SEMESTER CREDITS</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a">${totalCredits} Credits</text>
      </g>
      <!-- Card 4: Current Semester -->
      <g transform="translate(690, 0)">
        <rect width="210" height="64" rx="12" fill="#eff6ff" stroke="#bfdbfe"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#1d4ed8" text-transform="uppercase">CURRENT ENROLLMENT</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#1e40af">Semester ${currentSemester}</text>
      </g>
    </g>
  ` : `
    <g transform="translate(50, ${statsStartY})">
      <!-- Card 1: SGPA -->
      <g transform="translate(0, 0)">
        <rect width="210" height="64" rx="12" fill="#0b2545"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#93c5fd" text-transform="uppercase">SEMESTER SGPA</text>
        <text x="20" y="50" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#fbbf24">${sgpa !== null ? sgpa : (isCurrent ? 'In Progress' : 'Pending')}</text>
        ${sgpa !== null ? `<text x="78" y="50" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">/ 10.00</text>` : ''}
      </g>
      <!-- Card 2: Credits Earned -->
      <g transform="translate(230, 0)">
        <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b" text-transform="uppercase">CREDITS EARNED</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a">${earnedCredits} / ${totalCredits}</text>
      </g>
      <!-- Card 3: Semester Status -->
      <g transform="translate(460, 0)">
        <rect width="210" height="64" rx="12" fill="#f0fdf4" stroke="#bbf7d0"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#15803d" text-transform="uppercase">RESULT STATUS</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#166534">${semSummary.status || 'Completed'}</text>
      </g>
      <!-- Card 4: Cumulative CGPA -->
      <g transform="translate(690, 0)">
        <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b" text-transform="uppercase">CUMULATIVE CGPA</text>
        <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a">${Number(student.cgpa || 0).toFixed(2)}</text>
      </g>
    </g>
  `;

  const tableStartY = statsStartY + 85;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${finalHeight}" width="${width}" height="${finalHeight}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0b2545"/>
      <stop offset="100%" stop-color="#134074"/>
    </linearGradient>
    <linearGradient id="upcomingHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#581c87"/>
      <stop offset="100%" stop-color="#7e22ce"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.1"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect x="0" y="0" width="${width}" height="${finalHeight}" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#cardShadow)"/>

  <!-- AI Generated Diagonal Watermarks -->
  <g transform="translate(500, ${finalHeight / 2}) rotate(-26)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="900" fill="#64748b" fill-opacity="0.08" text-anchor="middle" letter-spacing="3">
      AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT
    </text>
  </g>

  <!-- Header Banner -->
  <g transform="translate(50, 30)">
    <rect width="900" height="96" rx="14" fill="${headerGradColor}"/>
    <text x="28" y="38" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#fbbf24" letter-spacing="1">VIDYASHILP UNIVERSITY</text>
    <text x="28" y="60" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">${headerMainTitle}</text>
    <text x="28" y="78" font-family="system-ui, sans-serif" font-size="11" font-weight="500" fill="#e0e7ff">Programme: ${escapeXml(program)} • Admission Batch: ${escapeXml(cohort)}</text>

    <!-- Student Name & UEN Box -->
    <rect x="580" y="16" width="290" height="64" rx="10" fill="#ffffff15" stroke="#ffffff30"/>
    <text x="598" y="40" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(name)}</text>
    <text x="598" y="62" font-family="monospace" font-size="12.5" font-weight="700" fill="#fbbf24">UEN: ${escapeXml(uen)} • Sem ${semesterNumber}</text>
  </g>

  <!-- Optional Upcoming Notice -->
  ${upcomingNoticeSvg}

  <!-- Stats Strip -->
  ${statsCardsSvg}

  <!-- Course Table -->
  <g transform="translate(50, ${tableStartY})">
    <!-- Table Header Strip -->
    <rect width="900" height="32" rx="8" fill="#0f172a"/>
    <text x="24" y="21" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#94a3b8">COURSE CODE</text>
    <text x="180" y="21" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#94a3b8">COURSE TITLE</text>
    <text x="710" y="21" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#94a3b8" text-anchor="middle">CREDITS</text>
    <text x="830" y="21" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#94a3b8" text-anchor="middle">GRADE / STATUS</text>

    <!-- Rows -->
    ${coursesSvg}
  </g>

  <!-- Footer Disclaimer -->
  <g transform="translate(50, ${finalHeight - 45})">
    <rect width="900" height="32" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="450" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="600" fill="#64748b" text-anchor="middle">
      Disclaimer: This semester report is an AI-generated mock summary created for demonstration purposes only. It is not an official university transcript.
    </text>
  </g>
</svg>
  `.trim();
}

/**
 * Image Card Generator Service
 * Dynamically generates full 8-semester Grade Card SVG (Legacy / Full Report)
 */
export function generateStudentGradeCardSvg(student) {
  const name = student.fullName || student.displayName || student.name || 'Student';
  const uen = student.uen || 'UEN01';
  const program = student.programme || student.program || 'B.Tech Computer Science and Engineering';
  const cohort = student.cohort || `${student.admissionCohort || '2024'} Batch`;
  const cgpa = (student.cgpa !== undefined && student.cgpa !== null ? Number(student.cgpa) : 8.85).toFixed(2);
  const completedCredits = student.completedCredits || 0;
  const totalCredits = student.totalCredits || 160;
  const remainingCredits = student.remainingCredits !== undefined ? student.remainingCredits : Math.max(0, totalCredits - completedCredits);
  const backlogs = student.failedCourses || [];
  const standing = backlogs.length > 0 ? 'Academic Warning (Active Backlog)' : 'Good Standing';
  const currentSemester = student.currentSemester || 5;

  const width = 1000;
  const rowHeight = 34;
  let currentY = 240;

  let semesterBlocksSvg = '';
  (student.semesters || []).forEach(sem => {
    const isUpcoming = sem.isUpcoming || sem.semester > currentSemester;
    const isCurrent = sem.isCurrent || sem.semester === currentSemester;
    const courses = sem.courses || [];
    const blockHeight = 44 + Math.max(1, courses.length) * rowHeight + 10;

    let coursesRows = '';
    courses.forEach((c, idx) => {
      const rowY = 38 + idx * rowHeight;
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      const gradeVal = isUpcoming ? 'UPCOMING' : (c.grade || (isCurrent ? 'In Progress' : 'Pending'));
      const gradeColor = isUpcoming ? '#9333ea' : getGradeColor(c.grade);

      coursesRows += `
      <g transform="translate(0, ${rowY})">
        <rect width="896" height="30" rx="6" fill="${bg}"/>
        <text x="24" y="20" font-family="monospace" font-size="11.5" font-weight="700" fill="#0f172a">${escapeXml(c.courseCode)}</text>
        <text x="180" y="20" font-family="system-ui, sans-serif" font-size="11.5" font-weight="600" fill="#334155">${escapeXml(c.courseName)}</text>
        <text x="710" y="20" font-family="monospace" font-size="11.5" font-weight="600" fill="#475569" text-anchor="middle">${c.credits || 0}</text>
        <g transform="translate(830, 5)">
          <rect x="-38" y="0" width="76" height="19" rx="9.5" fill="${gradeColor}" fill-opacity="0.15" stroke="${gradeColor}" stroke-width="1.2"/>
          <text x="0" y="13.5" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="${gradeColor}" text-anchor="middle">${escapeXml(gradeVal)}</text>
        </g>
      </g>
      `;
    });

    const headerBg = isUpcoming ? '#faf5ff' : '#f1f5f9';
    const headerBorder = isUpcoming ? '#e9d5ff' : '#cbd5e1';
    const titleColor = isUpcoming ? '#7c3aed' : '#0f172a';
    const sgpaText = isUpcoming ? 'Status: UPCOMING' : (sem.sgpa !== null ? `SGPA: ${Number(sem.sgpa).toFixed(2)}` : (isCurrent ? 'Current' : 'Pending'));

    semesterBlocksSvg += `
    <g transform="translate(52, ${currentY})">
      <rect width="896" height="${blockHeight}" rx="12" fill="#ffffff" stroke="${headerBorder}" stroke-width="1.5"/>
      <rect width="896" height="36" rx="12" fill="${headerBg}"/>
      <text x="20" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="${titleColor}">SEMESTER ${sem.semester} • Credits: ${sem.earnedCredits || 0} / ${sem.totalCredits || 0}</text>
      <text x="876" y="23" font-family="system-ui, sans-serif" font-size="11.5" font-weight="800" fill="${titleColor}" text-anchor="end">${escapeXml(sgpaText)}</text>
      ${coursesRows}
    </g>
    `;

    currentY += blockHeight + 14;
  });

  const finalHeight = currentY + 60;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${finalHeight}" width="${width}" height="${finalHeight}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0b2545"/>
      <stop offset="100%" stop-color="#134074"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${finalHeight}" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Watermark -->
  <g transform="translate(500, ${finalHeight / 2}) rotate(-26)">
    <text x="0" y="0" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#64748b" fill-opacity="0.08" text-anchor="middle" letter-spacing="3">
      AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT
    </text>
  </g>

  <!-- Header -->
  <g transform="translate(50, 30)">
    <rect width="900" height="96" rx="14" fill="url(#headerGrad)"/>
    <text x="28" y="38" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#fbbf24" letter-spacing="1">VIDYASHILP UNIVERSITY</text>
    <text x="28" y="60" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">OFFICIAL STUDENT ACADEMIC GRADE CARD • SEMESTERS REPORT</text>
    <text x="28" y="78" font-family="system-ui, sans-serif" font-size="11" font-weight="500" fill="#93c5fd">Programme: ${escapeXml(program)} • Admission Batch: ${escapeXml(cohort)}</text>

    <rect x="580" y="16" width="290" height="64" rx="10" fill="#ffffff15" stroke="#ffffff30"/>
    <text x="598" y="40" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(name)}</text>
    <text x="598" y="62" font-family="monospace" font-size="12.5" font-weight="700" fill="#fbbf24">UEN: ${escapeXml(uen)} • Current Sem ${currentSemester}</text>
  </g>

  <!-- Summary Cards -->
  <g transform="translate(50, 145)">
    <g transform="translate(0, 0)">
      <rect width="210" height="64" rx="12" fill="#0b2545"/>
      <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#93c5fd">CUMULATIVE CGPA</text>
      <text x="20" y="50" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#fbbf24">${cgpa}</text>
      <text x="76" y="50" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">/ 10.00</text>
    </g>
    <g transform="translate(230, 0)">
      <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b">CREDITS COMPLETED</text>
      <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a">${completedCredits} Earned</text>
    </g>
    <g transform="translate(460, 0)">
      <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b">CURRENT PROGRESSION</text>
      <text x="20" y="48" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a">Semester ${currentSemester}</text>
    </g>
    <g transform="translate(690, 0)">
      <rect width="210" height="64" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="20" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b">ACADEMIC STANDING</text>
      <text x="20" y="48" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="${backlogs.length > 0 ? '#b91c1c' : '#15803d'}">${escapeXml(standing)}</text>
    </g>
  </g>

  <!-- Semester Blocks -->
  ${semesterBlocksSvg}

  <!-- Footer Disclaimer -->
  <g transform="translate(50, ${finalHeight - 45})">
    <rect width="900" height="32" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="450" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="600" fill="#64748b" text-anchor="middle">
      Disclaimer: This grade card is an AI-generated mock report created for demonstration purposes only. It is not an official university document.
    </text>
  </g>
</svg>
  `.trim();
}

export function generateSemesterCoursesSvg(semesterNumber, batchName = '2024 Batch', courses = []) {
  return generateSemesterGradeCardSvg({
    fullName: 'Student',
    uen: 'UEN01',
    admissionCohort: batchName,
    currentSemester: 1,
    semesters: [{
      semester: semesterNumber,
      isUpcoming: true,
      courses
    }]
  }, semesterNumber);
}
