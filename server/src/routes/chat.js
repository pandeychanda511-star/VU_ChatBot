import express from 'express';
import { classifyIntent, INTENT_TYPES, STANDARD_RESPONSES } from '../services/intentClassifier.js';
import { getRetrievalEngine } from '../services/retrievalEngine.js';
import { getGeminiService } from '../services/geminiService.js';
import { SecurityService } from '../services/securityService.js';
import { AgenticWorkflowEngine } from '../services/agenticWorkflow.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';
import { 
  getAllStudents, 
  getStudentByIdOrUun, 
  resolveStudentFromQuery,
  normalizeUun
} from '../services/studentDatabaseService.js';
import { getCurriculumForCohort } from '../services/curriculumService.js';

const router = express.Router();

/**
 * Builds clean, deduplicated, and verified citation references from retrieved evidence records.
 */
function buildCitations(evidenceItems, usedEvidenceIds = null) {
  if (!evidenceItems || evidenceItems.length === 0) return [];

  let selectedItems = evidenceItems;
  if (usedEvidenceIds && usedEvidenceIds.length > 0) {
    const idSet = new Set(usedEvidenceIds);
    const filtered = evidenceItems.filter(item => idSet.has(item.id));
    if (filtered.length > 0) {
      selectedItems = filtered;
    }
  }

  const citations = [];
  const seenLocations = new Set();

  for (const item of selectedItems) {
    const key = `${item.fileName}::${item.sourceType === 'pdf' ? item.pageNumber : `${item.sheetName}_${item.rowNumber || item.id}`}`;
    if (seenLocations.has(key)) continue;
    seenLocations.add(key);

    let displayText;
    if (item.sourceType === 'pdf') {
      displayText = `${item.fileName} (Page ${item.pageNumber})`;
    } else if (item.metadata?.isSemesterOverview) {
      displayText = `${item.fileName} (Sheet: "${item.sheetName}" - Semester ${item.metadata.semesterNumber} Overview)`;
    } else if (item.metadata?.isMinorTrackOverview) {
      displayText = `${item.fileName} (Sheet: "${item.sheetName}" - Minor Track Overview)`;
    } else {
      displayText = `${item.fileName} (Sheet: "${item.sheetName}", Row ${item.rowNumber})`;
    }

    const citation = {
      id: item.id,
      fileName: item.fileName,
      displayText,
      sourceType: item.sourceType,
      textSnippet: item.text.slice(0, 200).trim(),
      metadata: item.metadata || {}
    };

    if (item.sourceType === 'pdf') {
      citation.pageNumber = item.pageNumber;
    } else if (item.sourceType === 'xlsx') {
      citation.sheetName = item.sheetName;
      citation.rowNumber = item.rowNumber;
    }

    citations.push(citation);
  }

  return citations;
}

/**
 * Helper to detect specific semester request from query (e.g., "Semester 1", "Sem 7", "current semester")
 * Returns null if the user is asking for ALL completed semesters or overall report.
 */
function extractRequestedSemester(query, currentSemester = 5) {
  const q = query.toLowerCase();
  
  // If user explicitly asks for ALL completed semesters or entire history, do not lock to a single semester
  if (
    q.includes('all completed') ||
    q.includes('all semester') ||
    q.includes('every completed') ||
    q.includes('all my completed') ||
    q.includes('academic history') ||
    q.includes('all details') ||
    q.includes('all grade card') ||
    q.includes('together')
  ) {
    return 'all_completed';
  }

  if (q.includes('current semester') || q.includes('my current')) {
    return currentSemester;
  }
  const match = q.match(/\b(semester\s*([1-8])|sem\s*([1-8]))\b/i);
  if (match) {
    return parseInt(match[2] || match[3], 10);
  }
  return null;
}

/**
 * POST /api/chat/message
 * Grounded Academic Advisor chat endpoint supporting standard RAG, Agentic workflow, and Dynamic Student Context.
 * Enforces Role-Based Access Control (RBAC):
 * - Admins can inspect any registered student.
 * - Authenticated Students can ONLY access their own records. Cross-student queries are strictly rejected.
 */
router.post('/message', optionalAuthenticateToken, async (req, res) => {
  const { message, studentProfileId, conversationHistory, mode } = req.body;
  const user = req.user; // populated if Bearer token present

  // 1. Validation
  if (message === undefined || message === null || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Message text is required and must be a string.',
      status: 'error'
    });
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      error: 'Message text cannot be empty or whitespace only.',
      status: 'error'
    });
  }

  if (trimmed.length > 1500) {
    return res.status(400).json({
      error: 'Message is too long (maximum 1,500 characters).',
      status: 'error'
    });
  }

  const timestamp = new Date().toISOString();

  // 2. Security Check (Phase 10 Privacy & Security Safeguards)
  const injectionCheck = SecurityService.detectPromptInjection(trimmed);
  if (injectionCheck.isInjection) {
    SecurityService.logSecurityEvent({
      eventType: 'INJECTION_ATTEMPT',
      query: trimmed,
      status: 'BLOCKED',
      details: { matchedPattern: injectionCheck.matchedPattern }
    });

    return res.status(200).json({
      reply: '🛡️ **Security Alert**: Your query contains instructions attempting to bypass academic advising policies. In accordance with Academic Privacy & Security standards, this operation was halted.',
      citations: [],
      status: 'blocked',
      timestamp
    });
  }

  // PII Inspection and Sanitization
  const piiCheck = SecurityService.inspectAndSanitizePII(trimmed);
  if (piiCheck.piiDetected) {
    SecurityService.logSecurityEvent({
      eventType: 'PII_DETECTED',
      query: trimmed,
      sanitizedQuery: piiCheck.sanitizedText,
      status: 'SANITIZED',
      details: { types: piiCheck.types }
    });
  }
  const processedQuery = piiCheck.sanitizedText;

  // 3. Delegate to Agentic Workflow if requested
  if (mode === 'agentic') {
    try {
      const agenticResult = await AgenticWorkflowEngine.run({
        userQuery: processedQuery,
        studentProfileId: studentProfileId || null,
        conversationHistory: conversationHistory || []
      });
      return res.status(200).json({
        ...agenticResult,
        piiSanitized: piiCheck.piiDetected,
        timestamp
      });
    } catch (err) {
      console.error('[Chat API] Agentic execution error:', err);
    }
  }

  // 4. Intent and Scope Handling
  const intentResult = classifyIntent(processedQuery);

  if (intentResult.isGreetingOrRedirect) {
    let status = 'greeting';
    if (intentResult.intent === INTENT_TYPES.SMALL_TALK) status = 'redirect';
    if (intentResult.intent === INTENT_TYPES.OUT_OF_SCOPE) status = 'out_of_scope';

    return res.status(200).json({
      reply: intentResult.directResponse,
      citations: [],
      status,
      timestamp
    });
  }

  // 5. Dynamic Student Resolution & RBAC Ownership Enforcement
  let activeStudent = null;
  const resolvedStudentFromQuery = resolveStudentFromQuery(trimmed);

  if (user && user.role === 'student') {
    // Authenticated Student: Retrieve strictly using Firebase UID or registered UUN
    const ownStudent = getStudentByIdOrUun(user.uid) || getStudentByIdOrUun(user.uun) || getStudentByIdOrUun(user.studentProfileId) || null;

    if (resolvedStudentFromQuery && ownStudent && resolvedStudentFromQuery.id !== ownStudent.id) {
      return res.status(200).json({
        reply: `🔒 **Access Denied**: You are signed in as **${ownStudent.fullName || ownStudent.name}** (${ownStudent.uun}). In accordance with university privacy regulations and Role-Based Access Control, students are restricted from accessing records of other students (${resolvedStudentFromQuery.fullName || resolvedStudentFromQuery.name}). You may only inquire about your own academic records.`,
        citations: [],
        status: 'access_denied',
        timestamp
      });
    }

    if (studentProfileId && ownStudent && studentProfileId !== ownStudent.id) {
      return res.status(200).json({
        reply: `🔒 **Access Denied**: You cannot switch profiles to other students. You are authorized only for your student record (**${ownStudent.fullName || ownStudent.name}**).`,
        citations: [],
        status: 'access_denied',
        timestamp
      });
    }

    activeStudent = ownStudent;
  } else {
    // Admin or general session
    if (studentProfileId) {
      activeStudent = getStudentByIdOrUun(studentProfileId);
    } else if (resolvedStudentFromQuery) {
      activeStudent = resolvedStudentFromQuery;
    }
  }

  // 6. Knowledge Retrieval
  let retrievalResult = null;
  let searchQuery = processedQuery;
  const semCheck = processedQuery.match(/\b(semester\s*([1-8])|sem\s*([1-8]))\b/i);
  if (semCheck && (processedQuery.toLowerCase().includes('course') || processedQuery.toLowerCase().includes('courses') || processedQuery.toLowerCase().includes('syllabus'))) {
    const sNum = semCheck[2] || semCheck[3];
    searchQuery = `courses offered in B.Tech semester ${sNum}`;
  }

  try {
    const retrievalEngine = await getRetrievalEngine();
    retrievalResult = await retrievalEngine.search(searchQuery, { limit: 10 });
  } catch (err) {
    console.error('[Chat API] Retrieval failed:', err.message);
    return res.status(500).json({
      error: 'An internal error occurred while searching university records.',
      status: 'error'
    });
  }

  // 7. Missing Evidence check (Skip if asking about student identity/profile where DB is primary context)
  const isStudentPersonalQuery = activeStudent && (
    trimmed.toLowerCase().includes('batch') ||
    trimmed.toLowerCase().includes('semester') ||
    trimmed.toLowerCase().includes('status') ||
    trimmed.toLowerCase().includes('grade') ||
    trimmed.toLowerCase().includes('cgpa') ||
    trimmed.toLowerCase().includes('sgpa') ||
    trimmed.toLowerCase().includes('result') ||
    trimmed.toLowerCase().includes('course') ||
    trimmed.toLowerCase().includes('who am i') ||
    trimmed.toLowerCase().includes('my details') ||
    trimmed.toLowerCase().includes('card')
  );

  if (!isStudentPersonalQuery && (!retrievalResult || retrievalResult.totalResults === 0 || retrievalResult.results.length === 0)) {
    return res.status(200).json({
      reply: STANDARD_RESPONSES.MISSING_DATA,
      citations: [],
      status: 'missing_data',
      timestamp
    });
  }

  // 8. Grounded Answer Generation via Gemini
  const geminiService = getGeminiService();

  if (!geminiService.isConfigured()) {
    const citations = buildCitations(retrievalResult?.results || []);
    const topDoc = retrievalResult?.results?.[0];
    const locationStr = topDoc?.sourceType === 'pdf'
      ? `Page ${topDoc.pageNumber}`
      : `Sheet "${topDoc?.sheetName}", Row ${topDoc?.rowNumber}`;

    const reply = topDoc 
      ? `[Configuration Notice: Gemini API Key is required for conversational synthesis]\n\nI found relevant evidence in **${topDoc.fileName}** (${locationStr}):\n\n"${topDoc.text.slice(0, 300)}..."`
      : `[Configuration Notice: Gemini API Key is required for conversational synthesis]`;

    return res.status(200).json({
      reply,
      citations,
      status: 'config_required',
      timestamp
    });
  }

  try {
    let contextualQuery = processedQuery;
    let requestedSemester = null;

    if (activeStudent) {
      const studentName = activeStudent.fullName || activeStudent.name;
      const currentSem = activeStudent.currentSemester || 5;
      const cohort = activeStudent.admissionCohort || '2024';
      const studentCurriculum = getCurriculumForCohort(cohort);
      requestedSemester = extractRequestedSemester(processedQuery, currentSem);

      // Distinguish Completed, Current, and Upcoming Semesters
      const completedSems = (activeStudent.semesters || []).filter(s => s.semester < currentSem);
      const currentSemObj = (activeStudent.semesters || []).find(s => s.semester === currentSem);
      const upcomingSems = (activeStudent.semesters || []).filter(s => s.semester > currentSem);

      // Build semester-wise course breakdown for AI prompt
      const semBreakdown = (activeStudent.semesters || []).map(s => {
        if (s.isUpcoming || s.semester > currentSem) {
          const uCourses = (s.courses || []).map(c => `${c.courseCode} - ${c.courseName} (${c.credits} cr) [Status: UPCOMING]`).join('; ');
          return `Semester ${s.semester} (Status: UPCOMING, Future Semester): ${uCourses || 'Courses listed in official cohort curriculum'}`;
        }
        if (s.semester === currentSem) {
          const cCourses = (s.courses || []).map(c => `${c.courseCode} - ${c.courseName} (${c.credits} cr) [Status: Current Semester - ${c.grade ? `Grade: ${c.grade}` : 'In Progress / Pending'}]`).join('; ');
          return `Semester ${s.semester} (Status: CURRENT ENROLLMENT, ${s.sgpa !== null ? `SGPA: ${s.sgpa}` : 'Results in Progress'}): ${cCourses}`;
        }
        const cList = (s.courses || []).map(c => `${c.courseCode}: ${c.courseName} (${c.credits} cr, Grade: ${c.grade || 'Passed'})`).join('; ');
        return `Semester ${s.semester} (COMPLETED, SGPA: ${s.sgpa !== null ? s.sgpa : 'N/A'}, Credits: ${s.earnedCredits}/${s.totalCredits}): ${cList}`;
      }).join('\n');

      // Curriculum details for current & upcoming semesters
      const currSemCoursesList = (studentCurriculum.semesters[currentSem] || []).map(c => `${c.courseCode} - ${c.courseName} (${c.credits} credits, Prerequisite: ${c.prerequisite || 'NIL'})`).join('\n');

      contextualQuery = `AUTHENTICATED STUDENT CONTEXT & OFFICIAL REAL-TIME ACADEMIC PROFILE:
- Full Name: ${studentName}
- University UEN: ${activeStudent.uun}
- Admission Batch: ${cohort} (B.Tech ${cohort} Admission Batch)
- Programme: ${activeStudent.programme || activeStudent.program}
- Current Enrolled Semester: Semester ${currentSem} (Automatically determined from admission batch ${cohort} and academic cycle)
- Completed Semesters: ${completedSems.map(s => `Semester ${s.semester}`).join(', ') || 'None yet'}
- Current Semester Status: Semester ${currentSem} (${currentSemObj?.sgpa !== null ? 'Results Published' : 'In Progress / Pending Results'})
- Upcoming Semesters: ${upcomingSems.map(s => `Semester ${s.semester}`).join(', ') || 'None'}
- Cumulative CGPA (out of 10.00 scale): ${activeStudent.cgpa}
- Credits Completed: ${activeStudent.completedCredits} / ${activeStudent.totalCredits || 160}
- Active Backlogs: ${(activeStudent.failedCourses || []).map(c => `${c.code} (${c.name}, ${c.credits} cr)`).join('; ') || 'None (Good Standing)'}

OFFICIAL B.TECH ${cohort} CURRICULUM COURSES FOR CURRENT SEMESTER (Semester ${currentSem}):
${currSemCoursesList}

DETAILED SEMESTER-WISE RESULTS & STATUS (DATABASE RECORDS):
${semBreakdown}

CRITICAL ADVISING RULES:
1. Always address the student as "${studentName}" (UEN: ${activeStudent.uun}).
2. Admission Batch: When asked about their batch, answer clearly: "You belong to the B.Tech ${cohort} admission batch."
3. Current Semester: When asked which semester they are currently studying in:
   - For 2023 batch: "You are currently in Semester 7 of the B.Tech programme. Your admission batch is 2023."
   - For 2024 batch: "You are currently in Semester 5 of the B.Tech programme. Your admission batch is 2024."
   - For 2025 batch: "You are currently in Semester 3 of the B.Tech programme. Your admission batch is 2025."
   - For 2026 batch: "You are currently in Semester 1 of the B.Tech programme. Your admission batch is 2026."
4. Upcoming Semester Validation:
   - If the student requests results or a grade card for an upcoming semester (> Semester ${currentSem}):
     Explicitly state: "You are currently studying in Semester ${currentSem} (${cohort} Admission Batch). Semester [X] is an upcoming semester for you. Therefore, your Semester [X] grade card is not available yet."
     Then list the official upcoming courses from their cohort curriculum with Course Code, Course Name, Credits, and Status: UPCOMING.
   - NEVER invent or fabricate grades, SGPA, or CGPA for future/upcoming semesters!
5. Current Semester Courses: When asked for "my current semester courses", list the official Semester ${currentSem} courses shown above.
6. Image Format Awareness: The system has an integrated multimodal rendering engine that automatically generates and embeds official visual semester report cards and PNG/PDF documents directly in the chat below your message when the user requests image format. NEVER say "I cannot provide this information in image format" or that image generation is unavailable. Simply provide the concise academic breakdown and explain that their visual report card has been generated below.
7. Privacy & Security: Under no circumstances allow switching to or revealing records of any other student.

STUDENT QUESTION:
${processedQuery}`;
    }

    const aiResult = await geminiService.generateGroundedAnswer(contextualQuery, retrievalResult?.results || []);
    const citations = buildCitations(retrievalResult?.results || [], aiResult.usedEvidenceIds);
    const isMissingData = aiResult.answer.includes(STANDARD_RESPONSES.MISSING_DATA);

    // Multimodal Image Card Attachment Detection (Phase 4):
    // Detects explicit image format requests:
    // "in image format", "as an image", "in image form", "show as picture", "generate an image", etc.
    let mediaAttachment = null;
    const qLower = trimmed.toLowerCase();
    const isAskingStudentCard = (
      qLower.includes('image format') ||
      qLower.includes('image form') ||
      qLower.includes('in image') ||
      qLower.includes('as an image') ||
      qLower.includes('as image') ||
      qLower.includes('image report') ||
      qLower.includes('as a picture') ||
      qLower.includes('as picture') ||
      qLower.includes('grade card') ||
      qLower.includes('report card') ||
      qLower.includes('marksheet') ||
      qLower.includes('generate my') ||
      qLower.includes('card image') ||
      (qLower.includes('generate') && (qLower.includes('semester') || qLower.includes('report')))
    );

    if (activeStudent && isAskingStudentCard) {
      const studentTitleName = activeStudent.fullName || activeStudent.name;
      const currentSem = activeStudent.currentSemester || 5;

      // Scenario 2: ALL COMPLETED SEMESTERS requested
      if (requestedSemester === 'all_completed') {
        const completedSems = (activeStudent.semesters || []).filter(s => s.semester < currentSem && (s.isCompleted || s.status === 'Completed' || s.sgpa !== null));
        const semRangeText = completedSems.length > 0 
          ? (completedSems.length === 1 ? `Semester ${completedSems[0].semester}` : `Semesters ${completedSems[0].semester}–${completedSems[completedSems.length - 1].semester}`)
          : 'All Completed Semesters';

        const pngDownloadUrl = `/api/students/${activeStudent.id}/card-png?completedOnly=true&download=true`;
        const pdfDownloadUrl = `/api/students/${activeStudent.id}/card-pdf?completedOnly=true`;

        mediaAttachment = {
          type: 'image',
          category: 'completed_semesters_report',
          title: `Official Academic Report Card (${semRangeText}) — ${studentTitleName}`,
          imageUrl: `/api/students/${activeStudent.id}/card-image?completedOnly=true`,
          pngUrl: pngDownloadUrl,
          pdfUrl: pdfDownloadUrl,
          caption: `Combined Academic Report Card containing all completed semesters in chronological order for ${studentTitleName} (UEN: ${activeStudent.uun}, ${activeStudent.admissionCohort} Batch)`
        };
      } else {
        // Scenario 1: Specific Semester requested (or default current semester)
        const targetSem = (typeof requestedSemester === 'number') ? requestedSemester : currentSem;
        const isUpcoming = targetSem > currentSem;

        const semParam = `?semester=${targetSem}`;
        const pngDownloadUrl = `/api/students/${activeStudent.id}/card-png${semParam}&download=true`;
        const pdfDownloadUrl = `/api/students/${activeStudent.id}/card-pdf${semParam}`;

        if (isUpcoming) {
          mediaAttachment = {
            type: 'image',
            category: 'upcoming_semester_report',
            title: `Upcoming Semester ${targetSem} Course Report — ${studentTitleName}`,
            imageUrl: `/api/students/${activeStudent.id}/card-image${semParam}`,
            pngUrl: pngDownloadUrl,
            pdfUrl: pdfDownloadUrl,
            caption: `Upcoming Semester ${targetSem} Course Structure for ${studentTitleName} (${activeStudent.admissionCohort} Batch). Grades not yet available.`
          };
        } else {
          mediaAttachment = {
            type: 'image',
            category: 'student_grade_card',
            title: `Semester ${targetSem} Academic Grade Card — ${studentTitleName}`,
            imageUrl: `/api/students/${activeStudent.id}/card-image${semParam}`,
            pngUrl: pngDownloadUrl,
            pdfUrl: pdfDownloadUrl,
            caption: `Official Semester ${targetSem} Grade Card for ${studentTitleName} (UEN: ${activeStudent.uun}, ${activeStudent.admissionCohort} Batch)`
          };
        }
      }
    }

    return res.status(200).json({
      reply: aiResult.answer,
      citations: isMissingData ? [] : citations,
      mediaAttachment,
      missingInformationNote: aiResult.missingInformationNote,
      piiSanitized: piiCheck.piiDetected,
      status: isMissingData ? 'missing_data' : 'success',
      timestamp
    });
  } catch (err) {
    console.error('[Chat API] Gemini generation error:', err.message);
    const isTimeout = err.message === 'GEMINI_API_TIMEOUT';
    const isQuota = err.status === 429 || (err.message && err.message.includes('429'));

    let userFacingError = 'The AI service is currently unavailable. Please try again shortly.';
    if (isTimeout) {
      userFacingError = 'The request timed out while communicating with the AI service. Please try asking again.';
    } else if (isQuota) {
      userFacingError = 'The AI service request quota was temporarily exceeded. Please try again in a moment.';
    }

    return res.status(503).json({
      error: userFacingError,
      status: 'error'
    });
  }
});

export default router;
