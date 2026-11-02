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
      sourceType: item.sourceType,
      fileName: item.fileName,
      displayText
    };

    if (item.sourceType === 'pdf') {
      citation.pageNumber = item.pageNumber;
    } else if (item.sourceType === 'excel') {
      citation.sheetName = item.sheetName;
      citation.rowNumber = item.rowNumber || 1;
    }

    citations.push(citation);
  }

  return citations;
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
    const ownStudent = getStudentByIdOrUun(user.uun) || getStudentByIdOrUun(user.studentProfileId) || null;

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
  if (semCheck && (processedQuery.toLowerCase().includes('course') || processedQuery.toLowerCase().includes('courses'))) {
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

  // 7. Missing Evidence check
  if (!retrievalResult || retrievalResult.totalResults === 0 || retrievalResult.results.length === 0) {
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
    const citations = buildCitations(retrievalResult.results);
    const topDoc = retrievalResult.results[0];
    const locationStr = topDoc.sourceType === 'pdf'
      ? `Page ${topDoc.pageNumber}`
      : `Sheet "${topDoc.sheetName}", Row ${topDoc.rowNumber}`;

    const reply = `[Configuration Notice: Gemini API Key is required for conversational synthesis]\n\nI found relevant evidence in **${topDoc.fileName}** (${locationStr}):\n\n"${topDoc.text.slice(0, 300)}..."\n\n*To enable AI synthesized answers, please set your GEMINI_API_KEY in server/.env.*`;

    return res.status(200).json({
      reply,
      citations,
      status: 'config_required',
      timestamp
    });
  }

  try {
    let contextualQuery = processedQuery;
    if (activeStudent) {
      const studentName = activeStudent.fullName || activeStudent.name;
      const s8 = activeStudent.semesters?.find(s => s.semester === 8);
      const s8Courses = s8 ? s8.courses.map(c => `${c.courseCode} (${c.courseName}, ${c.credits} cr, Status: UPCOMING)`).join('; ') : 'DATA803 (Capstone Project/Industrial Internship, 12 cr, Status: UPCOMING)';

      // Build semester-wise course breakdown
      const semBreakdown = (activeStudent.semesters || []).map(s => {
        if (s.isUpcoming || s.semester === 8) {
          return `Semester 8 (UPCOMING, 12 Credits): ${s.courses.map(c => `${c.courseCode} - ${c.courseName} (${c.credits} cr) [Status: UPCOMING]`).join('; ')}`;
        }
        const cList = (s.courses || []).map(c => `${c.courseCode}: ${c.courseName} (${c.credits} cr, Grade: ${c.grade || 'Ungraded'})`).join('; ');
        return `Semester ${s.semester} (SGPA: ${s.sgpa !== null ? s.sgpa : 'N/A'}, Credits: ${s.earnedCredits}/${s.totalCredits}): ${cList}`;
      }).join('\n');

      contextualQuery = `STUDENT PROFILE AND REAL-TIME ACADEMIC RECORDS:
Full Name: ${studentName}
UUN Number: ${activeStudent.uun}
Programme / Major: ${activeStudent.programme || activeStudent.program}
Admission Cohort: ${activeStudent.cohort || `${activeStudent.admissionCohort} Batch`}
Current Academic Standing: ${activeStudent.standing || 'Good Standing'}
Cumulative CGPA: ${activeStudent.cgpa}
Credits Completed: ${activeStudent.completedCredits} / ${activeStudent.totalCredits || 160}
Credits Remaining: ${activeStudent.remainingCredits || 0}
Semesters Completed: 7 (Semesters 1 to 7)
Upcoming Semester: Semester 8 (Status: UPCOMING, No grades assigned)
Upcoming Semester 8 Courses: ${s8Courses}
Active Backlogs: ${(activeStudent.failedCourses || []).map(c => `${c.code} (${c.name}, ${c.credits} cr)`).join('; ') || 'None (Good Standing)'}

SEMESTER-WISE COURSE GRADES:
${semBreakdown}

Important Instructions:
- Always refer to the student by their registered full name: "${studentName}" (UUN: ${activeStudent.uun}).
- If asked about their grades, semester results, credits, or performance, directly answer using the above real-time academic records.
- If asked about Semester 8 or upcoming courses, clearly state that Semester 8 is marked as UPCOMING with 12 credits (DATA803 Capstone Project) and has not commenced yet.

STUDENT QUESTION:
${processedQuery}`;
    }

    const aiResult = await geminiService.generateGroundedAnswer(contextualQuery, retrievalResult.results);
    const citations = buildCitations(retrievalResult.results, aiResult.usedEvidenceIds);
    const isMissingData = aiResult.answer.includes(STANDARD_RESPONSES.MISSING_DATA);

    // Multimodal Image Card Attachment Detection:
    let mediaAttachment = null;
    const isAskingStudentCard = (
      trimmed.toLowerCase().includes('grade card') ||
      trimmed.toLowerCase().includes('detail') ||
      trimmed.toLowerCase().includes('report') ||
      trimmed.toLowerCase().includes('result') ||
      trimmed.toLowerCase().includes('card') ||
      trimmed.toLowerCase().includes('marksheet') ||
      trimmed.toLowerCase().includes('performance') ||
      trimmed.toLowerCase().includes('cgpa') ||
      trimmed.toLowerCase().includes('image')
    );

    if (activeStudent && isAskingStudentCard) {
      const studentTitleName = activeStudent.fullName || activeStudent.name;
      mediaAttachment = {
        type: 'image',
        category: 'student_grade_card',
        title: `Official Student Academic Grade Card — ${studentTitleName}`,
        imageUrl: `/api/students/${activeStudent.id}/card-image`,
        pdfUrl: `/api/students/${activeStudent.id}/card-pdf`,
        caption: `Live Grade Card for ${studentTitleName} (UUN: ${activeStudent.uun}, Semesters 1–7 Results & Upcoming Semester 8)`
      };
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
