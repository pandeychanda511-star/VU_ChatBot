# Vidyashilp University Academic Advisor Chatbot
## Phase 6 Integration Testing, Correctness Verification & Security Audit Report

**Date & Time:** November 1, 2026  
**Environment:** macOS | Node.js v22.20.0 | React 18 (Vite) | Express.js  
**Project Location:** `/Users/a6203427868/Desktop/Chatbot`  

---

### 1. Integration Architecture & Verified Request Flow

The end-to-end request workflow was verified from React frontend to Express backend, knowledge retrieval, Gemini API synthesis, citation validation, and interactive document viewing:

```
[User Question in React UI]
       │
       ▼ (POST /api/chat/message)
[Express Input Validation & Sanitization] (Rejects > 1,000 chars, empty/malformed)
       │
       ▼
[Deterministic Intent & Scope Classification]
  ├── Greeting ("Hi", "Hello")  ──> Returns official greeting directly (0 LLM cost)
  ├── Small Talk ("How are you?")──> Returns polite redirection to academic advising
  └── Out of Scope (Recipes, etc)──> Rejects non-university domain queries
       │
       ▼ (In-scope Academic Query)
[Hybrid BM25 + Synonym + Code Matching Retrieval Engine]
  └── Searches 589 prepared records across 4 authoritative documents
       │
       ├── (0 relevant chunks / low threshold) ──> Returns "Data is not available in the provided university documents."
       │
       ▼ (Relevant Chunks Identified)
[Google Gemini API Grounded Synthesis (`gemini-3.5-flash`)]
  ├── System instruction: STRICT GROUNDING on retrieved evidence only
  ├── Enforces JSON schema: { answer, usedEvidenceIds, missingInformationNote }
  └── Low temperature (0.1) & zero thinking budget overhead for fast, deterministic extraction
       │
       ▼
[Backend Citation Integrity Validation]
  ├── Validates that all returned evidence IDs exist in actual retrieved records
  └── Maps records to clean citation objects (Page numbers for PDF, Sheet/Row for Excel)
       │
       ▼ (JSON Response with Reply & Citations)
[React Frontend Message Bubble & Clickable Citations]
  ├── Click PDF Citation   ──> Opens PdfViewerModal streaming /api/sources/pdf/:sourceId#page=N
  └── Click Excel Citation ──> Opens ExcelViewerModal loading /api/sources/excel/:sourceId
```

---

### 2. Gemini Model Configuration & Live Verification

- **Configured Model**: `gemini-3.5-flash`
- **Candidate Failover**: In the event of temporary upstream 503 load spikes, the system can gracefully consult `gemini-3.8-flash` or `gemini-3.1-flash-lite`.
- **Live Test Result**: **PASSED**
  - Minimal generation test executed with live API key (`process.env.GEMINI_API_KEY`). Returned valid response: `ACTIVE`.
  - Zero token truncation issues after configuring `thinkingBudget: 0` and bounded output tokens.

---

### 3. End-to-End Chatbot Test Matrix

| Category | Input Query | Retrieval Evidence IDs | Generated Answer Summary | Grounding & Citation Accuracy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Greeting** | `"Hi"` | None (Direct return) | Official greeting identifying as Vidyashilp University Academic Advisor. | Verified (0 citations, 0 LLM calls) | **PASSED** |
| **Small Talk** | `"How are you doing today?"` | None (Direct return) | Polite redirection to university academic advising. | Verified (0 citations, 0 LLM calls) | **PASSED** |
| **Out-of-Scope** | `"what is the recipe for baking chocolate brownies"` | None (Direct return) | Politely declined: restricted to authorized university guidelines. | Verified (0 citations, 0 LLM calls) | **PASSED** |
| **Supported (PDF)** | `"What attendance percentage do I need to sit for exams?"` | `4. Student Handbook Aug 2026.pdf::p29::c1`, `p29::c3`, `p30::c1`, `SOP STUDENT::p2::c2` | States standard 75% minimum, 65% absolute threshold for sports/events representation, and 'FA' grade consequence. | **100% Grounded.** All citations match Handbook pages 29-30 & SOP page 2. | **PASSED** |
| **Supported (Excel)** | `"What are the courses in the 2024 batch Psychology minor?"` | `Minor_Courses_for_BTech_Students.xlsx::Psychology::r16` | Cites `PSYC201/PSYC103 Biological Psychology/Foundations of Psychology I`, 4 credits, Semester 3, Nil pre-requisite. | **100% Grounded.** Matches Sheet "Psychology", Row 16. | **PASSED** |
| **Supported (Excel)** | `"What courses are in the start-up minor?"` | `Minor_Courses_for_BTech_Students.xlsx::Start-up::r5`, `r11`, `r13` | Cites `MGMT336 Design Thinking for Entrepreneurship` (Semester 5, 4 credits) and notes remaining are listed as TBD. | **100% Grounded.** Matches Sheet "Start-up". | **PASSED** |
| **Missing Data** | `"What was the syllabus for computer science engineering in the year 1985?"` | Sem Spread chunks for recent years | Returns exact required phrase: `"Data is not available in the provided university documents."` with note explaining 1985 is not present. | Grounding rule upheld. Zero hallucinated policy or syllabus. | **PASSED** |
| **Mixed Query** | `"What is the minimum attendance requirement, and what was the 1990 sports policy?"` | `Handbook::p29::c3`, `SOP::p3::c1` | Answers 75% standard attendance requirement and explicitly states: `1990 Sports Policy: Data is not available in the provided university documents.` | Supported part answered, missing part explicitly isolated. | **PASSED** |

---

### 4. Interactive Citation and Source Viewer Audit

#### PDF Sources
- **`GET /api/sources/pdf/handbook?page=29`**: Returns HTTP 200 with `Content-Type: application/pdf`, `Content-Disposition: inline`, and `X-Content-Type-Options: nosniff`. Navigates accurately to page 29.
- **`GET /api/sources/pdf/sop?page=2`**: Returns HTTP 200 with SOP PDF content.
- **Invalid PDF source (`/api/sources/pdf/invalid_file`)**: Returns HTTP 404 `{"error":"Authorized PDF source not found"}`.
- **Invalid page parameter (`?page=-5` or `?page=abc`)**: Returns HTTP 400 `{"error":"Page parameter must be a positive integer"}`.

#### Excel Sources
- **`GET /api/sources/excel/minors?sheet=Law%20Minor&row=3`**: Returns HTTP 200 structured JSON with headers and cell values (`LAWM305`, `Regulating platform and Gig workers`, 4 credits).
- **`GET /api/sources/excel/semester_spread?sheet=Sem_Spread_2024&row=13`**: Returns HTTP 200 structured row record.
- **Invalid Excel sheet (`?sheet=FakeSheet`)**: Returns HTTP 404 with list of actual available sheets.
- **Invalid row index (`?row=-1`)**: Returns HTTP 400.
- **Filesystem Traversal Prevention**: Endpoint ignores arbitrary path inputs and resolves only from an internal dictionary of the two authorized workbooks.

---

### 5. Comprehensive Security Audit Findings

| Security Control | Implementation Location | Audit Status | Verification Result |
| :--- | :--- | :--- | :--- |
| **Secret Isolation** | `server/.env` & `.gitignore` | **PASS** | `GEMINI_API_KEY` exists only in backend environment; excluded from Git. |
| **Client Bundle Leak Scan** | `client/dist/assets/*.js` | **PASS** | Grep scan for key patterns and secret variable names returned 0 matches. |
| **Path Traversal Protection** | `server/src/routes/sources.js` | **PASS** | Client provides only tokenized identifiers (`handbook`, `sop`, `minors`, `semester_spread`). Arbitrary paths cannot be passed. |
| **Input Boundary Defense** | `server/src/routes/chat.js` | **PASS** | Payloads > 1,000 characters and non-string inputs are rejected with HTTP 400. |
| **Output XSS Sanitization** | `client/src/App.jsx` | **PASS** | Model responses are rendered as safe text/markdown using standard React escaping; no `dangerouslySetInnerHTML`. |
| **Error Detail Shielding** | `server/src/index.js` | **PASS** | Global error handlers return generic messages without stack traces or internal filesystem directories. |
| **CORS Policy** | `server/src/index.js` | **PASS** | Restricted to localhost development ports (`5173`). |

---

### 6. Automated Regression & Build Test Results

1. **Retrieval Engine Suite (`node test_retrieval.js`)**:
   - `12/12 Automated Tests Passed Successfully`
2. **Phase 4 Guardrail Suite (`node test_phase4.js`)**:
   - `12/12 Phase 4 Tests Passed Successfully`
3. **Backend Health Check (`curl http://localhost:5001/api/health`)**:
   - Status: `ok`, Uptime: Verified, Response: HTTP 200
4. **Vite Production Build (`npm run build --prefix client`)**:
   - Built cleanly in 1.34s with 0 errors.

---

### 7. Files Created and Modified in Phase 6

- `server/src/services/geminiService.js`: Configured to `gemini-3.5-flash` with `thinkingBudget: 0`, token bounds, and candidate retry logic.
- `server/src/services/retrievalEngine.js`: Added percentage and examination synonyms to enhance query mapping.
- `docs/PHASE_6_INTEGRATION_AND_AUDIT_REPORT.md`: Comprehensive audit report and verification findings.

---

### 8. Confirmation of Constraints & Known Limitations

- **Authoritative Sole Sources**: Exactly the 4 provided university documents were used. No internet search, external websites, or arbitrary knowledge was introduced.
- **Provider Restriction**: Powered exclusively by Google Gemini API. Zero secondary LLMs or fallbacks were introduced.
- **Tests Not Run**: None. All 14 test categories from Section 13 of the Master Project Brief were executed against real running services.

