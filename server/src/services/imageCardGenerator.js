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
 * Image Card Generator Service
 * Dynamically generates a comprehensive academic report card SVG
 * including Section 1: Student Info, Section 2: Completed Semesters 1-7,
 * Section 3: Upcoming Semester 8, Section 4: Academic Credit Summary,
 * and AI-Generated Watermark.
 *
 * @param {object} student - Student record with semesters breakdown
 * @returns {string} SVG xml string
 */
export function generateStudentGradeCardSvg(student) {
  const name = student.fullName || student.displayName || student.name || 'Student';
  const uun = student.uun || 'UUN01';
  const program = student.programme || student.program || 'B.Tech Computer Science and Engineering';
  const cohort = student.cohort || `${student.admissionCohort || '2024'} Batch`;
  const cgpa = (student.cgpa !== undefined && student.cgpa !== null ? Number(student.cgpa) : 3.65).toFixed(2);
  const completedCredits = student.completedCredits || 0;
  const totalCredits = student.totalCredits || 160;
  const remainingCredits = student.remainingCredits !== undefined ? student.remainingCredits : Math.max(0, totalCredits - completedCredits);
  const backlogs = student.failedCourses || [];
  const standing = backlogs.length > 0 ? 'Academic Warning (Active Backlog)' : 'Good Standing';

  const semesters = student.semesters || [];

  // Responsive SVG canvas dimensions
  const width = 1000;
  // Calculate dynamic height based on semester tables
  // Header: 120, Info: 120, Summary: 110, Semesters 1-7 (approx 160 each = 1120), Sem 8: 120, Footer: 70
  const height = 1800;

  // Render Semester 1 to 7 blocks
  let currentY = 270;
  let semesterBlocksSvg = '';

  for (let s = 1; s <= 7; s++) {
    const semData = semesters.find(x => x.semester === s) || {
      semester: s,
      sgpa: 3.50,
      totalCredits: 20,
      earnedCredits: 20,
      courses: []
    };

    const courses = semData.courses || [];
    const tableHeight = 44 + Math.max(1, courses.length) * 36 + 12;

    semesterBlocksSvg += `
      <!-- Semester ${s} Card -->
      <g transform="translate(50, ${currentY})">
        <rect width="900" height="${tableHeight}" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
        
        <!-- Header Strip -->
        <path d="M 0 14 Q 0 0 14 0 L 886 0 Q 900 0 900 14 L 900 42 L 0 42 Z" fill="#f8fafc"/>
        <line x1="0" y1="42" x2="900" y2="42" stroke="#e2e8f0" stroke-width="1"/>
        
        <text x="24" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#0b2545">SEMESTER ${s}</text>
        <text x="145" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="600" fill="#64748b">Earned: ${semData.earnedCredits || semData.totalCredits || 0} / ${semData.totalCredits || 0} Credits</text>
        
        <rect x="760" y="8" width="125" height="26" rx="6" fill="#0b2545"/>
        <text x="822" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#fbbf24" text-anchor="middle">SGPA: ${semData.sgpa !== null ? semData.sgpa.toFixed(2) : 'N/A'}</text>
        
        <!-- Table Column Headers -->
        <g transform="translate(0, 42)">
          <rect width="900" height="28" fill="#f1f5f9"/>
          <text x="24" y="18" font-family="monospace" font-size="10.5" font-weight="700" fill="#64748b">COURSE CODE</text>
          <text x="160" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">OFFICIAL COURSE TITLE</text>
          <text x="680" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">CREDITS</text>
          <text x="795" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">GRADE OBTAINED</text>
        </g>
    `;

    courses.forEach((c, cIdx) => {
      const rowY = 78 + cIdx * 34;
      const rowBg = cIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const gradeColor = getGradeColor(c.grade);

      semesterBlocksSvg += `
        <rect x="8" y="${rowY - 8}" width="884" height="30" rx="6" fill="${rowBg}"/>
        <text x="24" y="${rowY + 12}" font-family="monospace" font-size="11.5" font-weight="700" fill="#1e293b">${c.courseCode}</text>
        <text x="160" y="${rowY + 12}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#334155">${escapeXml(c.courseName)}</text>
        <text x="700" y="${rowY + 12}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#64748b">${c.credits}</text>
        
        <rect x="765" y="${rowY - 4}" width="115" height="23" rx="5" fill="${gradeColor}18" stroke="${gradeColor}40" stroke-width="1"/>
        <text x="822" y="${rowY + 12}" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="800" fill="${gradeColor}" text-anchor="middle">${c.grade || '—'}</text>
      `;
    });

    semesterBlocksSvg += `</g>`;
    currentY += tableHeight + 24;
  }

  // Section 3: Semester 8 (UPCOMING)
  const sem8Data = semesters.find(x => x.semester === 8) || {
    semester: 8,
    status: 'UPCOMING',
    courses: [{ courseCode: 'DATA803', courseName: 'Capstone Project/Industrial Internship', credits: 12 }]
  };
  const sem8Courses = sem8Data.courses || [];
  const sem8TableHeight = 45 + Math.max(1, sem8Courses.length) * 32 + 15;

  const sem8Svg = `
    <!-- Section 3: Semester 8 (UPCOMING) -->
    <g transform="translate(50, ${currentY})">
      <rect width="900" height="${sem8TableHeight}" rx="14" fill="#faf5ff" stroke="#d8b4fe" stroke-width="2"/>
      
      <!-- Purple Accent Header -->
      <path d="M 0 14 Q 0 0 14 0 L 886 0 Q 900 0 900 14 L 900 42 L 0 42 Z" fill="#6b21a8"/>
      <text x="24" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#ffffff">SEMESTER 8 – UPCOMING CURRICULUM</text>
      <text x="320" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#e9d5ff">Not Started • In Progress Next Academic Cycle</text>
      
      <rect x="760" y="8" width="125" height="26" rx="6" fill="#f3e8ff"/>
      <text x="822" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#6b21a8" text-anchor="middle">STATUS: UPCOMING</text>
      
      <!-- Table Header -->
      <g transform="translate(0, 45)">
        <text x="20" y="16" font-family="monospace" font-size="10" font-weight="700" fill="#7e22ce">COURSE CODE</text>
        <text x="160" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#7e22ce">UPCOMING COURSE NAME</text>
        <text x="690" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#7e22ce">CREDITS</text>
        <text x="805" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#7e22ce">ACADEMIC STATUS</text>
      </g>
  `;

  let sem8RowsSvg = '';
  sem8Courses.forEach((c, idx) => {
    const rowY = 75 + idx * 30;
    sem8RowsSvg += `
      <rect x="10" y="${rowY - 14}" width="880" height="26" rx="6" fill="#ffffff" stroke="#f3e8ff"/>
      <text x="20" y="${rowY + 2}" font-family="monospace" font-size="12" font-weight="800" fill="#581c87">${c.courseCode}</text>
      <text x="160" y="${rowY + 2}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#3b0764">${escapeXml(c.courseName)}</text>
      <text x="705" y="${rowY + 2}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#6b21a8">${c.credits} Credits</text>
      
      <rect x="785" y="${rowY - 10}" width="95" height="20" rx="4" fill="#6b21a8"/>
      <text x="832" y="${rowY + 4}" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">UPCOMING</text>
    `;
  });

  const sem8BlockComplete = sem8Svg + sem8RowsSvg + `</g>`;
  currentY += sem8TableHeight + 20;

  // Section 4: Academic Credit Summary
  const summarySvg = `
    <!-- Section 4: Academic Credit & CGPA Summary -->
    <g transform="translate(50, 150)">
      <rect width="900" height="95" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      
      <!-- Metric 1: CGPA -->
      <g transform="translate(20, 16)">
        <rect width="160" height="62" rx="10" fill="#0b2545"/>
        <text x="16" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">CUMULATIVE CGPA</text>
        <text x="16" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#fbbf24">${cgpa}</text>
        <text x="95" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">/ 10.00</text>
      </g>
      
      <!-- Metric 2: Completed Credits -->
      <g transform="translate(195, 16)">
        <rect width="160" height="62" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="16" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#64748b">CREDITS COMPLETED</text>
        <text x="16" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#0b2545">${completedCredits}</text>
        <text x="75" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#64748b">Earned</text>
      </g>

      <!-- Metric 3: Remaining Credits -->
      <g transform="translate(370, 16)">
        <rect width="160" height="62" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="16" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#64748b">CREDITS REMAINING</text>
        <text x="16" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#b45309">${remainingCredits}</text>
        <text x="75" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#64748b">Pending</text>
      </g>

      <!-- Metric 4: Semesters -->
      <g transform="translate(545, 16)">
        <rect width="160" height="62" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="16" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#64748b">SEMESTERS COMPLETED</text>
        <text x="16" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#047857">7</text>
        <text x="50" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#7c3aed">(1 Upcoming)</text>
      </g>

      <!-- Metric 5: Status -->
      <g transform="translate(720, 16)">
        <rect width="160" height="62" rx="10" fill="${backlogs.length > 0 ? '#fef2f2' : '#ecfdf5'}" stroke="${backlogs.length > 0 ? '#fca5a5' : '#a7f3d0'}"/>
        <text x="16" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="${backlogs.length > 0 ? '#991b1b' : '#065f46'}">ACADEMIC STATUS</text>
        <text x="16" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="${backlogs.length > 0 ? '#b91c1c' : '#047857'}">${backlogs.length > 0 ? 'Active Backlog' : 'Good Standing'}</text>
      </g>
    </g>
  `;

  // Final adjusted total height
  const finalHeight = currentY + 70;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${finalHeight}" width="${width}" height="${finalHeight}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b2545"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <filter id="cardShadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect x="0" y="0" width="${width}" height="${finalHeight}" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#cardShadow)"/>

  <!-- AI Generated Diagonal Watermarks across canvas -->
  <g transform="translate(500, 500) rotate(-28)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#64748b" fill-opacity="0.09" text-anchor="middle" letter-spacing="3">
      AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT
    </text>
  </g>
  <g transform="translate(500, 1100) rotate(-28)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#64748b" fill-opacity="0.09" text-anchor="middle" letter-spacing="3">
      AI GENERATED – NOT AN OFFICIAL UNIVERSITY DOCUMENT
    </text>
  </g>

  <!-- Section 1: Header & Student Information -->
  <g transform="translate(50, 30)">
    <rect width="900" height="100" rx="16" fill="url(#headerGrad)"/>
    
    <text x="30" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#fbbf24" letter-spacing="1">VIDYASHILP UNIVERSITY</text>
    <text x="30" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff">OFFICIAL STUDENT ACADEMIC GRADE CARD • SEMESTERS 1–8 REPORT</text>
    <text x="30" y="84" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#93c5fd">Programme: ${escapeXml(program)} • Admission Cohort: ${escapeXml(cohort)}</text>
    
    <!-- Student Name & UUN in Header -->
    <rect x="580" y="18" width="290" height="64" rx="12" fill="#ffffff15" stroke="#ffffff30"/>
    <text x="600" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="900" fill="#ffffff">${escapeXml(name)}</text>
    <text x="600" y="66" font-family="monospace" font-size="13" font-weight="700" fill="#fbbf24">UUN: ${escapeXml(uun)}</text>
  </g>

  <!-- Section 4: Summary Strip -->
  ${summarySvg}

  <!-- Section 2: Completed Semesters (1 to 7) -->
  ${semesterBlocksSvg}

  <!-- Section 3: Upcoming Semester 8 -->
  ${sem8BlockComplete}

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

/**
 * Semester course listing SVG
 */
export function generateSemesterCoursesSvg(semesterNumber, batchName = '2024 Batch', courses = []) {
  const width = 850;
  const height = 400 + Math.max(1, courses.length) * 35;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" rx="16" stroke="#cbd5e1" stroke-width="2"/>
  <text x="40" y="50" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#0b2545">Semester ${semesterNumber} Curriculum — ${escapeXml(batchName)}</text>
</svg>
  `.trim();
}
